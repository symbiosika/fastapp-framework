import { nanoid } from "nanoid";
import { generateLongText } from "../standard";
import { initChatMessage } from "../chat/get-prompt-template";
import { replaceCustomPlaceholders, replaceVariables } from "../chat/replacer";
import { customAppPlaceholders } from "../chat/custom-placeholders";
import {
  parseIntFromUnknown,
  parseStringFromUnknown,
} from "../../helper/parsers";
import type { AgentDefinition, AgentExecution } from "./types";
import { ChatMessage, type ChatSessionContext } from "../chat/chat-store";
import { LLMOptions } from "../../../dbSchema";
import { ReActAgent } from "./react-agent";

export class LLMAgent extends ReActAgent {
  constructor() {
    super(
      "LLM Agent",
      "Processes text using a language model",
      undefined, // systemPrompt wird aus den Messages genommen
      "Analyze the conversation history and decide if a response is needed.",
      "Generate a thoughtful response based on the conversation history."
    );
  }

  getDefinition(): AgentDefinition {
    return {
      id: "llm-agent",
      name: "LLM Agent",
      description: "Processes text using a language model",
      category: "text",
      inputSchema: {
        user_input: {
          type: "text",
          description: "The user input to process",
          required: false,
        },
      },
      outputSchema: {
        default: {
          type: "text",
          description: "The LLM response",
        },
      },
      visibleToUser: true,
      isAsynchronous: false,
    };
  }

  async think(
    context: ChatSessionContext,
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<boolean> {
    // LLM Agent braucht kein komplexes Thinking - er reagiert immer auf Benutzereingaben
    // Wir könnten hier in Zukunft Logik hinzufügen, um zu entscheiden, ob eine Antwort nötig ist
    return true; // Immer handeln (eine Antwort generieren)
  }

  async act(
    context: ChatSessionContext,
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<string> {
    try {
      // Ersetze Variablen in den Nachrichten
      const replaced = await replaceVariables(this.memory, variables);

      // Behandle benutzerdefinierte Platzhalter
      const { replacedMessages, addToMeta } = await replaceCustomPlaceholders(
        replaced,
        customAppPlaceholders,
        variables,
        context
      );

      // Parse die Optionen
      const llmOptions = {
        maxTokens: parseIntFromUnknown(modelOptions?.maxTokens),
        model: parseStringFromUnknown(modelOptions?.model),
        temperature: modelOptions?.temperature !== undefined 
          ? Number(modelOptions.temperature) 
          : undefined,
        outputType: "text" as const,
      };

      // Führe den LLM-Aufruf durch
      const result = await generateLongText(
        replacedMessages as any,
        llmOptions,
        context
      );

      // Füge das Ergebnis zum Speicher hinzu
      this.updateMemory("assistant", result.text, {
        model: result.meta?.model,
        human: false,
      });

      return result.text;
    } catch (error: any) {
      throw new Error(`Error in LLM Agent: ${error.message}`);
    }
  }

  // Überschreibe run, um die Maximalschritte auf 1 zu setzen
  async run(
    context: ChatSessionContext,
    messages: ChatMessage[],
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<AgentExecution> {
    // LLM Agent braucht nur einen Schritt
    this.maxSteps = 1;
    return super.run(context, messages, variables, modelOptions);
  }

  validateInputs(inputs: Record<string, any>): boolean {
    // Either user_input or messages should be provided
    return (
      typeof inputs.user_input === "string" || Array.isArray(inputs.messages)
    );
  }

  getExecutionStatus(executionId: string): Promise<AgentExecution | null> {
    return Promise.resolve(null);
  }

  cancel(executionId: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
