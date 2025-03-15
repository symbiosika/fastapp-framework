import { nanoid } from "nanoid";
import { LLMOptions } from "../../../dbSchema";
import { compareTextVersions, formatTextDiffAsHtml } from "../../text/diff";
import {
  ChatMessage,
  chatStore,
  type ChatSessionContext,
} from "../chat/chat-store";
import type { AgentDefinition, AgentExecution } from "./types";
import { ReActAgent } from "./react-agent";
import log from "../../../lib/log";

export class DiffAgent extends ReActAgent {
  constructor() {
    super(
      "Text Diff Agent",
      "Compares two versions of text and shows the differences",
      "You are a text comparison specialist. Your task is to analyze and highlight differences between text versions.",
      "Analyze the input texts and determine if they can be compared.",
      "Compare the texts and generate a diff showing the changes."
    );
  }

  getDefinition(): AgentDefinition {
    return {
      id: "diff-text",
      name: "Text vergleichen",
      description: "Vergleicht zwei Textversionen und zeigt die Unterschiede",
      category: "text",
      inputSchema: {
        old_text: {
          type: "text",
          description: "Die alte Version des Textes",
          required: true,
        },
        new_text: {
          type: "text",
          description: "Die neue Version des Textes",
          required: true,
        },
        formatAsHtml: {
          type: "boolean",
          description: "Ob die Unterschiede als HTML formatiert werden sollen",
          required: false,
        },
      },
      outputSchema: {
        diff: {
          type: "text",
          description: "Die Unterschiede zwischen den Texten",
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
    // Prüfe, ob die erforderlichen Eingaben vorhanden sind
    const oldText = variables.old_text;
    const newText = variables.new_text;

    if (!oldText || !newText) {
      log.error("DiffAgent: Fehlende Eingaben für den Textvergleich");
      return false; // Keine Aktion ausführen
    }

    // Für den DiffAgent ist das Thinking sehr einfach - wir müssen nur prüfen, ob die Eingaben vorhanden sind
    return true; // Immer handeln, wenn die Eingaben vorhanden sind
  }

  async act(
    context: ChatSessionContext,
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<string> {
    try {
      // Aktualisiere den Fortschritt
      const execution = this.createProgressExecution(context.chatId);
      await this.updateAgentExecutionInChat(context.chatId, execution);

      // Get the old and new text versions from inputs
      const oldText = variables.old_text ? variables.old_text.toString() : "";
      const newText = variables.new_text ? variables.new_text.toString() : "";
      const formatAsHtml = variables.formatAsHtml === true;

      // Generate the diff
      const textDiff = compareTextVersions(oldText, newText);

      // Format as HTML if requested
      const result = formatAsHtml
        ? formatTextDiffAsHtml(textDiff)
        : JSON.stringify(textDiff);

      // Aktualisiere den Status
      execution.outputs.diff = result;
      execution.metadata = {
        diffCount: textDiff.length,
      };
      execution.status = "completed";
      execution.progress = 100;
      execution.progressMessage = "Textvergleich abgeschlossen";
      execution.endTime = new Date().toISOString();
      await this.updateAgentExecutionInChat(context.chatId, execution);

      return result;
    } catch (error: any) {
      const errorMessage = `Fehler beim Textvergleich: ${error.message}`;
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
    return (
      typeof inputs.old_text === "string" && typeof inputs.new_text === "string"
    );
  }

  // Überschreibe run, um die Maximalschritte auf 1 zu setzen
  async run(
    context: ChatSessionContext,
    messages: ChatMessage[],
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<AgentExecution> {
    // DiffAgent braucht nur einen Schritt
    this.maxSteps = 1;
    return super.run(context, messages, variables, modelOptions);
  }
}
