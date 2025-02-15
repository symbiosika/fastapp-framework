import * as v from "valibot";
import { chatStore } from "./chat-store";
import { initChatMessage } from "./get-prompt-template";
import type { ChatSession } from "./chat-store";
import type { LLMOptions } from "../../db/db-schema";
import { generateLongText } from "../standard";
import { replaceVariables } from "./replacer";

/**
 * This valibot validation ensures we get the required fields when the user
 * responds in an interview. Adjust fields as needed: for instance, if you
 * need "moderator" or other data in each call, you can add them here.
 */
const interviewRespondValidation = v.object({
  userId: v.string(),
  organisationId: v.string(),
  chatId: v.string(),

  // The user's input to the interview
  user_input: v.string(),

  // Optionally allow LLM options
  llmOptions: v.optional(
    v.object({
      model: v.optional(v.string()),
      maxTokens: v.optional(v.number()),
      temperature: v.optional(v.number()),
    })
  ),
});

/**
 * Handles the core interview logic, generating responses based on the context
 * and user input
 */
async function generateInterviewResponse(
  messages: any[],
  userInput: string,
  session: ChatSession,
  llmOptions: LLMOptions
) {
  // Initialize with system prompt if this is the first message
  if (messages.length === 0) {
    const systemPrompt = `
      You are conducting an interview about: "${session.state.interview?.name ?? "No name provided"}".
      Guidelines: ${session.state.interview?.guidelines ?? "No guidelines provided"}.
      The issue is about: "${session.state.interview?.description ?? "No description provided"}".
      Please respond as a structured interviewer, ensuring we do not go off-topic.
    `;

    messages.push(
      initChatMessage(systemPrompt, "system", {
        human: false,
        timestamp: new Date().toISOString(),
      })
    );
  }

  // Add user message
  messages.push(
    initChatMessage(userInput, "user", {
      human: true,
      timestamp: new Date().toISOString(),
    })
  );

  // Replace variables and generate response
  const replacedMessages = await replaceVariables(messages, {
    user_input: userInput,
    interviewName: session.state.interview?.name,
    interviewDescription: session.state.interview?.description,
    guidelines: session.state.interview?.guidelines,
  });

  const result = await generateLongText(replacedMessages as any, {
    maxTokens: llmOptions.maxTokens,
    model: llmOptions.model,
    temperature: llmOptions.temperature,
    outputType: "text" as const,
  });

  return result.text;
}

/**
 * Respond to an ongoing interview session.
 */
export async function respondInInterview(query: unknown) {
  // 1) Validate user input
  const parsed = v.parse(interviewRespondValidation, query);

  // 2) Retrieve the session
  const session: ChatSession | null = await chatStore.get(parsed.chatId);
  if (!session) {
    throw new Error(`No existing interview with chatId=${parsed.chatId}`);
  }

  const messages = [...session.messages];
  const llmOptions: LLMOptions = {
    model: parsed.llmOptions?.model ?? "openai:gpt-4o-mini",
    maxTokens: parsed.llmOptions?.maxTokens ?? 1000,
    temperature: parsed.llmOptions?.temperature ?? 0,
  };

  // Generate interview response
  const response = await generateInterviewResponse(
    messages,
    parsed.user_input,
    session,
    llmOptions
  );

  // Create and append the interviewer's reply
  const interviewerReply = initChatMessage(response, "assistant", {
    human: false,
    model: llmOptions.model,
    timestamp: new Date().toISOString(),
  });
  messages.push(interviewerReply);

  // Update chat session
  await chatStore.set(parsed.chatId, {
    messages,
    updatedAt: new Date().toISOString(),
  });

  return {
    chatId: parsed.chatId,
    interview: session.state.interview,
    lastMessage: interviewerReply,
  };
}
