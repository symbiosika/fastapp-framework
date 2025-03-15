import { nanoid } from "nanoid";
import { LLMOptions } from "../../../dbSchema";
import { compareTextVersions, formatTextDiffAsHtml } from "../../text/diff";
import {
  ChatMessage,
  chatStore,
  type ChatSessionContext,
} from "../chat/chat-store";
import type { AgentDefinition, BaseAgent, AgentExecution } from "./types";

export class DiffAgent implements BaseAgent {
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
      await this.updateAgentExecutionInChat(context.chatId, execution);

      // Get the old and new text versions from inputs
      const oldText = execution.inputs.old_text
        ? execution.inputs.old_text.toString()
        : "";
      const newText = execution.inputs.new_text
        ? execution.inputs.new_text.toString()
        : "";
      const formatAsHtml = execution.inputs.formatAsHtml === true;

      // Generate the diff
      const textDiff = compareTextVersions(oldText, newText);

      // Format as HTML if requested
      const result = formatAsHtml
        ? formatTextDiffAsHtml(textDiff)
        : JSON.stringify(textDiff);

      execution.outputs.diff = result;
      execution.metadata = {
        diffCount: textDiff.length,
      };

      execution.status = "completed";
      execution.progress = 100;
      execution.progressMessage = "Textvergleich abgeschlossen";
      execution.endTime = new Date().toISOString();
    } catch (error) {
      execution.status = "failed";
      execution.error = error + "";
      execution.endTime = new Date().toISOString();
    }

    await this.updateAgentExecutionInChat(context.chatId, execution);

    return execution;
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

  getExecutionStatus(executionId: string): Promise<AgentExecution | null> {
    return Promise.resolve(null);
  }

  cancel(executionId: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
