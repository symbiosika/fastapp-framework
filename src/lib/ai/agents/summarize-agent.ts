import { nanoid } from "nanoid";
import { LLMOptions } from "../../../dbSchema";
import { AgentInputVariables } from "../../types/agents";
import type { ChatMessage, ChatSessionContext } from "../chat/chat-store";
import { chatStore } from "../chat/chat-store";
import { LLMAgent } from "./llm-agent";
import type { AgentDefinition, BaseAgent, AgentExecution } from "./types";

export class SummarizeTextAgent implements BaseAgent {
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

  async run(
    context: ChatSessionContext,
    messages: ChatMessage[],
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<AgentExecution> {
    const execution: AgentExecution = {
      id: nanoid(16),
      agentId: this.getDefinition().id,
      status: "running",
      inputs: variables,
      outputs: {},
      startTime: new Date().toISOString(),
    };
    try {
      execution.status = "running";
      await this.updateAgentExecutionInChat(context.chatId, execution);

      const { text, maxLength = 1000 } = execution.inputs;

      // Für sehr lange Texte: in Chunks aufteilen und jeden zusammenfassen
      if (text.length > 10000) {
        const chunks = this.splitTextIntoChunks(text, 5000);
        let chunkSummaries = [];

        for (let i = 0; i < chunks.length; i++) {
          // Aktualisiere Fortschritt
          execution.progress = Math.floor((i / chunks.length) * 80);
          execution.progressMessage = `Verarbeite Teil ${i + 1} von ${chunks.length}`;
          await this.updateAgentExecutionInChat(context.chatId, execution);

          // Fasse jeden Chunk zusammen
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
                content: chunks[i],
              },
            ],
            {
              user_input: chunks[i],
            },
            { maxTokens: 500 }
          );

          chunkSummaries.push(chunkResult.outputs.default);
        }

        // Erstelle die endgültige Zusammenfassung aus den Chunk-Zusammenfassungen
        execution.progress = 90;
        execution.progressMessage = "Erstelle finale Zusammenfassung";
        await this.updateAgentExecutionInChat(context.chatId, execution);

        const finalSummaryText = chunkSummaries.join("\n\n");
        const llmAgent = new LLMAgent();
        const finalResult = await llmAgent.run(
          context,
          [
            {
              role: "system",
              content: `Fasse die folgenden Teilzusammenfassungen zu einer kohärenten Gesamtzusammenfassung zusammen. 
                      Die Zusammenfassung sollte maximal ${maxLength} Zeichen lang sein.`,
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

        execution.outputs.summary = finalResult.outputs.default;
      } else {
        // Für kürzere Texte: direkt zusammenfassen
        const llmAgent = new LLMAgent();
        const result = await llmAgent.run(
          context,
          [
            {
              role: "system",
              content: `Fasse den folgenden Text zusammen. Die Zusammenfassung sollte maximal ${maxLength} Zeichen lang sein.`,
            },
            {
              role: "user",
              content: text,
            },
          ],
          {
            user_input: text,
          },
          { maxTokens: 1000 }
        );

        execution.outputs.summary = result.outputs.default;
      }

      execution.status = "completed";
      execution.progress = 100;
      execution.progressMessage = "Zusammenfassung abgeschlossen";
      execution.endTime = new Date().toISOString();
    } catch (error) {
      execution.status = "failed";
      execution.error = error + "";
      execution.endTime = new Date().toISOString();
    }

    await this.updateAgentExecutionInChat(context.chatId, execution);

    return execution;
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

  getExecutionStatus(executionId: string): Promise<AgentExecution | null> {
    return Promise.resolve(null);
  }

  cancel(executionId: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
