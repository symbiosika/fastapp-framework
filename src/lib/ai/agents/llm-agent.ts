import { generateLongText } from "../standard";
import { initChatMessage } from "../chat/get-prompt-template";
import { replaceCustomPlaceholders, replaceVariables } from "../chat/replacer";
import { customAppPlaceholders } from "../chat/custom-placeholders";
import type {
  AgentContext,
  AgentOutput,
  Agent,
  AgentOptions,
} from "../../types/agents";
import type { ChatStoreVariables } from "../chat/chat-store";
import {
  parseIntFromUnknown,
  parseStringFromUnknown,
} from "../../helper/parsers";

export class LLMAgent implements Agent {
  name = "llmAgent";

  async run(
    context: AgentContext,
    inputs: ChatStoreVariables,
    options: AgentOptions
  ): Promise<AgentOutput> {
    // The "default" input variable is "user_input", but your code can adapt:
    const userInput = inputs.user_input ? inputs.user_input.toString() : "";

    // Convert userInput into the messages (like you do in chatWithAgent):
    // In your existing code, you have initChatMessage, etc.

    const userMessage = initChatMessage(userInput, "user");
    const replaced = await replaceVariables([userMessage], inputs);

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
