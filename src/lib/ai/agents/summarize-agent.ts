import { nanoid } from "nanoid";
import { LLMOptions } from "../../../dbSchema";
import type { ChatMessage, ChatSessionContext } from "../chat/chat-store";
import { chatStore } from "../chat/chat-store";
import { LLMAgent } from "./llm-agent";
import type { AgentDefinition, AgentExecution } from "./types";
import { ReActAgent } from "./react-agent";
import log from "../../../lib/log";

export class SummarizeTextAgent extends ReActAgent {
  private chunks: string[] = [];
  private chunkSummaries: string[] = [];
  private currentChunkIndex: number = 0;
  private isFinalSummary: boolean = false;

  constructor() {
    super(
      "Text Summarizer",
      "Summarizes long text into a concise version",
      "You are a text summarization expert. Your task is to create concise, accurate summaries of text.",
      "Analyze the text and plan how to summarize it effectively.",
      "Create a summary of the text based on your analysis."
    );
  }

  getDefinition(): AgentDefinition {
    return {
      id: "summarize-text",
      name: "Text zusammenfassen",
      description: "Fasst einen langen Text zusammen",
      category: "text",
      inputSchema: {
        text: {
          type: "text",
          description: "Der lange Text, der zusammengefasst werden soll",
          required: true,
        },
        maxLength: {
          type: "number",
          description: "Maximale Länge der Zusammenfassung in Zeichen",
          required: false,
        },
      },
      outputSchema: {
        summary: {
          type: "text",
          description: "Die Zusammenfassung des Textes",
        },
      },
      visibleToUser: true,
      isAsynchronous: true,
    };
  }

  async think(
    context: ChatSessionContext,
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<boolean> {
    const { text } = variables;

    // Wenn wir noch keine Chunks haben, teilen wir den Text auf
    if (this.chunks.length === 0 && text) {
      // Für sehr lange Texte: in Chunks aufteilen
      if (text.length > 10000) {
        this.chunks = this.splitTextIntoChunks(text, 5000);
        log.logCustom(
          { name: "SummarizeTextAgent" },
          `Text in ${this.chunks.length} Chunks aufgeteilt`
        );
        return true; // Wir müssen handeln (den ersten Chunk zusammenfassen)
      } else {
        // Für kürzere Texte: nur einen Chunk
        this.chunks = [text];
        this.isFinalSummary = true; // Direkt zur finalen Zusammenfassung
        return true;
      }
    }

    // Wenn wir bereits Chunks haben, prüfen wir, ob wir alle verarbeitet haben
    if (this.currentChunkIndex < this.chunks.length) {
      return true; // Wir müssen den nächsten Chunk verarbeiten
    }

    // Wenn wir alle Chunks verarbeitet haben, aber noch keine finale Zusammenfassung erstellt haben
    if (this.chunkSummaries.length > 0 && !this.isFinalSummary) {
      this.isFinalSummary = true;
      return true; // Wir müssen die finale Zusammenfassung erstellen
    }

    // Wenn wir die finale Zusammenfassung erstellt haben, sind wir fertig
    return false;
  }

  async act(
    context: ChatSessionContext,
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<string> {
    const { maxLength = 1000 } = variables;
    let result: string;

    try {
      // Aktualisiere den Fortschritt
      const execution = this.createProgressExecution(context.chatId);
      
      if (!this.isFinalSummary) {
        // Verarbeite den aktuellen Chunk
        execution.progress = Math.floor((this.currentChunkIndex / this.chunks.length) * 80);
        execution.progressMessage = `Verarbeite Teil ${this.currentChunkIndex + 1} von ${this.chunks.length}`;
        await this.updateAgentExecutionInChat(context.chatId, execution);

        // Fasse den aktuellen Chunk zusammen
        const llmAgent = new LLMAgent();
        const chunkResult = await llmAgent.run(
          context,
          [
            {
              role: "system",
              content: "Fasse den folgenden Text kurz zusammen.",
            },
            {
              role: "user",
              content: this.chunks[this.currentChunkIndex],
            },
          ],
          {
            user_input: this.chunks[this.currentChunkIndex],
          },
          { maxTokens: 500 }
        );

        // Speichere die Zusammenfassung des Chunks
        const summary = chunkResult.outputs.default;
        this.chunkSummaries.push(summary);
        this.currentChunkIndex++;
        
        result = `Chunk ${this.currentChunkIndex} von ${this.chunks.length} zusammengefasst: ${summary.substring(0, 100)}...`;
      } else {
        // Erstelle die finale Zusammenfassung
        execution.progress = 90;
        execution.progressMessage = "Erstelle finale Zusammenfassung";
        await this.updateAgentExecutionInChat(context.chatId, execution);

        let finalSummaryText: string;
        let systemPrompt: string;

        if (this.chunkSummaries.length > 1) {
          // Wenn wir mehrere Chunks haben, fassen wir die Zusammenfassungen zusammen
          finalSummaryText = this.chunkSummaries.join("\n\n");
          systemPrompt = `Fasse die folgenden Teilzusammenfassungen zu einer kohärenten Gesamtzusammenfassung zusammen. 
                        Die Zusammenfassung sollte maximal ${maxLength} Zeichen lang sein.`;
        } else {
          // Wenn wir nur einen Chunk haben, fassen wir den direkt zusammen
          finalSummaryText = this.chunks[0];
          systemPrompt = `Fasse den folgenden Text zusammen. Die Zusammenfassung sollte maximal ${maxLength} Zeichen lang sein.`;
        }

        const llmAgent = new LLMAgent();
        const finalResult = await llmAgent.run(
          context,
          [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: finalSummaryText,
            },
          ],
          {
            user_input: finalSummaryText,
          },
          { maxTokens: 1000 }
        );

        result = finalResult.outputs.default;
        
        // Setze den Status auf abgeschlossen
        execution.status = "completed";
        execution.progress = 100;
        execution.progressMessage = "Zusammenfassung abgeschlossen";
        execution.outputs.summary = result;
        execution.endTime = new Date().toISOString();
        await this.updateAgentExecutionInChat(context.chatId, execution);
      }

      return result;
    } catch (error: any) {
      const errorMessage = `Fehler bei der Zusammenfassung: ${error.message}`;
      log.error(errorMessage);
      
      // Aktualisiere den Fehler im Execution-Objekt
      const execution = this.createProgressExecution(context.chatId);
      execution.status = "failed";
      execution.error = errorMessage;
      execution.endTime = new Date().toISOString();
      await this.updateAgentExecutionInChat(context.chatId, execution);
      
      throw new Error(errorMessage);
    }
  }

  private createProgressExecution(chatId: string): AgentExecution {
    return {
      id: nanoid(16),
      agentId: this.getDefinition().id,
      status: "running",
      inputs: {},
      outputs: {},
      startTime: new Date().toISOString(),
    };
  }

  private splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
  }

  private async updateAgentExecutionInChat(
    chatId: string,
    execution: AgentExecution
  ): Promise<void> {
    const session = await chatStore.get(chatId);
    if (!session) throw new Error(`Chat session ${chatId} not found`);

    if (!session.state.agentExecutions) {
      session.state.agentExecutions = {};
    }

    session.state.agentExecutions[execution.id] = execution;

    await chatStore.set(chatId, {
      state: session.state,
    });
  }

  validateInputs(inputs: Record<string, any>): boolean {
    return typeof inputs.text === "string" && inputs.text.length > 0;
  }

  // Überschreibe run, um die Variablen zu initialisieren
  async run(
    context: ChatSessionContext,
    messages: ChatMessage[],
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<AgentExecution> {
    // Initialisiere die Zustandsvariablen
    this.chunks = [];
    this.chunkSummaries = [];
    this.currentChunkIndex = 0;
    this.isFinalSummary = false;
    
    // Setze eine höhere Anzahl von Schritten für lange Texte
    if (variables.text && variables.text.length > 10000) {
      const estimatedChunks = Math.ceil(variables.text.length / 5000);
      this.maxSteps = estimatedChunks + 1; // Chunks + finale Zusammenfassung
    } else {
      this.maxSteps = 2; // Ein Schritt für kurze Texte
    }
    
    return super.run(context, messages, variables, modelOptions);
  }
}
