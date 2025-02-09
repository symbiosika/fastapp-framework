import { generateLongText } from "../standard";
import { initChatMessage } from "../chat/get-prompt-template";
import { replaceCustomPlaceholders, replaceVariables } from "../chat/replacer";
import { customAppPlaceholders } from "../chat/custom-placeholders";
import type {
  AgentContext,
  AgentOutput,
  Agent,
  AgentOptions,
  AgentInputVariables,
} from "../../types/agents";
import {
  parseIntFromUnknown,
  parseStringFromUnknown,
} from "../../helper/parsers";

export class LLMAgent implements Agent {
  name = "llmAgent";

  async run(
    context: AgentContext,
    inputs: AgentInputVariables,
    options: AgentOptions
  ): Promise<AgentOutput> {
    // The "default" input variable is "user_input"
    const userInput = inputs.user_input ? inputs.user_input.toString() : "";

    const messages = inputs.messages ?? [];
    // Only add the user message if it's not already the last message in the conversation
    if (
      !inputs.messagesIncludeUserPrompt &&
      (messages.length === 0 ||
        messages[messages.length - 1].role !== "user" ||
        messages[messages.length - 1].content !== userInput)
    ) {
      messages.push(initChatMessage(userInput, "user"));
    }

    const replaced = await replaceVariables(messages, inputs);

    // Possibly handle custom placeholders
    const { replacedMessages } = await replaceCustomPlaceholders(
      replaced,
      customAppPlaceholders,
      inputs,
      context
    );

    // Parse the options
    const llmOptions = {
      maxTokens: parseIntFromUnknown(options.maxTokens, 1000),
      model: parseStringFromUnknown(options.model, "openai:gpt-4o-mini"),
      temperature: parseIntFromUnknown(options.temperature, 0),
      outputType: "text" as const,
    };

    // Then run the LLM call
    const result = await generateLongText(replacedMessages as any, llmOptions);

    // Return the LLM result as "default"
    return {
      outputs: {
        default: result.text,
      },
      metadata: {},
    };
  }
}
