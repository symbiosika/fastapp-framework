import * as v from "valibot";
import { chatStore } from "./chat-store";
import { initChatMessage } from "./get-prompt-template";
import { InterviewAgent } from "../agents/interview-agent";
import type { ChatSession } from "./chat-store";
import type { AgentInputVariables } from "../../types/agents";
import type { LLMOptions } from "../../db/db-schema";

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
 * Respond to an ongoing interview session. This function is meant to act
 * as a "middleware" between your API endpoint and the InterviewAgent.
 *
 * 1. Validate incoming data.
 * 2. Retrieve the relevant chat session (which stores interview data).
 * 3. Append the user's message to the chat history.
 * 4. Call the InterviewAgent, which returns interviewer-like responses.
 * 5. Update the chat store with the new messages and return to the caller.
 */
export async function respondInInterview(query: unknown) {
  // 1) Validate user input
  const parsed = v.parse(interviewRespondValidation, query);

  // 2) Retrieve the session
  const session: ChatSession | null = await chatStore.get(parsed.chatId);
  if (!session) {
    throw new Error(`No existing interview with chatId=${parsed.chatId}`);
  }

  // Don't add the user message here, let the agent handle it
  const messages = [...session.messages];

  // 4) Call the InterviewAgent
  const agent = new InterviewAgent();
  const agentInputs: AgentInputVariables = {
    user_input: parsed.user_input,
    interviewName: session.state.interview?.name ?? "",
    interviewDescription: session.state.interview?.description ?? "",
    guidelines: session.state.interview?.guidelines ?? "",
    messages: messages,
    messagesIncludeUserPrompt: false,
  } as any;

  // Merge any user-provided llmOptions with defaults
  const llmOptions: LLMOptions = {
    model: parsed.llmOptions?.model ?? "openai:gpt-4o-mini",
    maxTokens: parsed.llmOptions?.maxTokens ?? 1000,
    temperature: parsed.llmOptions?.temperature ?? 0,
  };

  const agentResult = await agent.run(
    {
      userId: parsed.userId,
      organisationId: parsed.organisationId,
      chatSessionGroupId: session.chatSessionGroupId ?? undefined,
    },
    agentInputs,
    llmOptions
  );

  // 5) Append the agent's response
  const interviewerReply = initChatMessage(
    agentResult.outputs.default,
    "assistant",
    {
      human: false,
      model: llmOptions.model,
      timestamp: new Date().toISOString(),
    }
  );
  messages.push(interviewerReply);

  // 6) Update the chat session
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
