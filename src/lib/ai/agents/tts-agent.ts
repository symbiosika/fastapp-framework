import { nanoid } from "nanoid";
import { LLMOptions } from "../../../dbSchema";
import type { ChatMessage, ChatSessionContext } from "../chat/chat-store";
import { chatStore } from "../chat/chat-store";
import type { AgentDefinition, BaseAgent, AgentExecution } from "./types";
import { textToSpeech } from "../standard";
import { saveFileToDb } from "../../storage/db";

export class TTSAgent implements BaseAgent {
  getDefinition(): AgentDefinition {
    return {
      id: "tts-agent",
      name: "Text to Speech",
      description: "Converts text to speech audio",
      category: "audio",
      inputSchema: {
        text: {
          type: "text",
          description: "The text to convert to speech",
          required: true,
        },
        voice: {
          type: "text",
          description: "Voice to use for the speech",
          required: false,
        },
      },
      outputSchema: {
        fileId: {
          type: "text",
          description: "The file id of the generated audio file",
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

      const { text } = execution.inputs;

      // process
      const audio = await textToSpeech(text, modelOptions, context);

      // save file to db
      const fileId = await saveFileToDb(
        audio.file,
        "artifacts",
        context.organisationId,
        {
          chatId: context.chatId,
        }
      );

      // Set the output
      execution.outputs.fileId = fileId.id;

      execution.status = "completed";
      execution.progress = 100;
      execution.progressMessage = "Text to speech conversion completed";
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
    return typeof inputs.text === "string" && inputs.text.length > 0;
  }

  getExecutionStatus(executionId: string): Promise<AgentExecution | null> {
    return Promise.resolve(null);
  }

  cancel(executionId: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
