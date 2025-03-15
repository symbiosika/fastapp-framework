import { generateLongText } from "../standard";
import { initChatMessage } from "../chat/get-prompt-template";
import { replaceCustomPlaceholders, replaceVariables } from "../chat/replacer";
import { customAppPlaceholders } from "../chat/custom-placeholders";
import {
  parseIntFromUnknown,
  parseStringFromUnknown,
} from "../../helper/parsers";
import type { BaseAgent, AgentDefinition, AgentExecution } from "./types";
import { ChatMessage, type ChatSessionContext } from "../chat/chat-store";
import { LLMOptions } from "../../../dbSchema";
import { nanoid } from "nanoid";

export class LLMAgent implements BaseAgent {
  name = "llmAgent";

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

      // The "default" input variable is "user_input"
      const userInput = execution.inputs.user_input
        ? execution.inputs.user_input.toString()
        : "";

      const messages = execution.inputs.messages ?? [];
      // Only add the user message if it's not already the last message in the conversation
      if (
        !execution.inputs.messagesIncludeUserPrompt &&
        (messages.length === 0 ||
          messages[messages.length - 1].role !== "user" ||
          messages[messages.length - 1].content !== userInput)
      ) {
        messages.push(
          initChatMessage(userInput, "user", {
            human: true,
            timestamp: new Date().toISOString(),
          })
        );
      }

      const replaced = await replaceVariables(messages, execution.inputs);

      // Possibly handle custom placeholders
      const { replacedMessages, addToMeta } = await replaceCustomPlaceholders(
        replaced,
        customAppPlaceholders,
        execution.inputs,
        context
      );

      // Parse the options
      const llmOptions = {
        maxTokens: parseIntFromUnknown(modelOptions?.maxTokens),
        model: parseStringFromUnknown(modelOptions?.model),
        temperature: parseIntFromUnknown(modelOptions?.temperature),
        outputType: "text" as const,
      };

      // Then run the LLM call
      const result = await generateLongText(
        replacedMessages as any,
        llmOptions,
        context
      );

      const metadata = {
        ...addToMeta,
        ...result.meta,
      };

      // Return the LLM result as "default" along with metadata
      execution.outputs.default = result.text;
      execution.metadata = metadata;
      execution.status = "completed";
      execution.endTime = new Date().toISOString();
    } catch (error: any) {
      execution.status = "failed";
      execution.error = error.message;
      execution.endTime = new Date().toISOString();
    }

    return execution;
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
