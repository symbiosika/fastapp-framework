import { nanoid } from "nanoid";
import { LLMOptions } from "../../../dbSchema";
import type { ChatMessage, ChatSessionContext } from "../chat/chat-store";
import { chatStore } from "../chat/chat-store";
import type { AgentDefinition, AgentExecution } from "./types";
import { textToSpeech } from "../standard";
import { saveFileToDb } from "../../storage/db";
import { ReActAgent } from "./react-agent";
import log from "../../../lib/log";

export class TTSAgent extends ReActAgent {
  constructor() {
    super(
      "Text to Speech Agent",
      "Converts text to speech audio",
      "You are a text-to-speech conversion specialist. Your task is to convert text into natural-sounding speech.",
      "Analyze the input text and determine if it can be converted to speech.",
      "Convert the text to speech and save the audio file."
    );
  }

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

  async think(
    context: ChatSessionContext,
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<boolean> {
    // Prüfe, ob die erforderlichen Eingaben vorhanden sind
    const text = variables.text;

    if (!text) {
      log.error("TTSAgent: Fehlender Text für die Sprachsynthese");
      return false; // Keine Aktion ausführen
    }

    // Für den TTSAgent ist das Thinking sehr einfach - wir müssen nur prüfen, ob der Text vorhanden ist
    return true; // Immer handeln, wenn der Text vorhanden ist
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

      const { text } = variables;

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
      await this.updateAgentExecutionInChat(context.chatId, execution);

      return `Audio file generated with ID: ${fileId.id}`;
    } catch (error: any) {
      const errorMessage = `Error in text-to-speech conversion: ${error.message}`;
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
    return typeof inputs.text === "string" && inputs.text.length > 0;
  }

  // Überschreibe run, um die Maximalschritte auf 1 zu setzen
  async run(
    context: ChatSessionContext,
    messages: ChatMessage[],
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<AgentExecution> {
    // TTSAgent braucht nur einen Schritt
    this.maxSteps = 1;
    return super.run(context, messages, variables, modelOptions);
  }
}
