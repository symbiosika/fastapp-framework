import type {
  Agent,
  AgentContext,
  AgentOptions,
  AgentInputVariables,
  AgentOutput,
} from "../../types/agents";
import { generateLongText } from "../standard";
import { initChatMessage } from "../chat/get-prompt-template";
import { replaceVariables } from "../chat/replacer";
import { parseStringFromUnknown } from "../../helper/parsers";
import { parseIntFromUnknown } from "../../helper/parsers";

export class InterviewAgent implements Agent {
  name = "interviewAgent";

  async run(
    context: AgentContext,
    inputs: AgentInputVariables,
    options: AgentOptions
  ): Promise<AgentOutput> {
    const userInput = inputs.user_input ? inputs.user_input.toString() : "";
    const messages = inputs.messages ?? [];

    // If this is the first message, initialize with system prompt
    if (messages.length === 0) {
      const guidelines = inputs.guidelines ?? "No guidelines provided";
      const interviewDescription =
        inputs.interviewDescription ?? "No description provided";
      const interviewName = inputs.interviewName ?? "No name provided";

      const systemPrompt = `
        You are conducting an interview about: "${interviewName}".
        Guidelines: ${guidelines}.
        The issue is about: "${interviewDescription}".
        Please respond as a structured interviewer, ensuring we do not go off-topic.
      `;

      messages.push(
        initChatMessage(systemPrompt, "system", {
          human: false,
          timestamp: new Date().toISOString(),
        })
      );
    }

    // Add user message if it's not already included
    if (
      !inputs.messagesIncludeUserPrompt &&
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

    // Replace variables and placeholders
    const replacedMessages = await replaceVariables(messages, inputs);

    const llmOptions = {
      maxTokens: parseIntFromUnknown(options.maxTokens, 1000),
      model: parseStringFromUnknown(options.model, "openai:gpt-4o-mini"),
      temperature: parseIntFromUnknown(options.temperature, 0),
      outputType: "text" as const,
    };
    const result = await generateLongText(replacedMessages as any, llmOptions);

    return {
      outputs: {
        default: result.text,
      },
      metadata: {},
    };
  }
}
