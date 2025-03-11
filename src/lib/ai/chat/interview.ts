import * as v from "valibot";
import { chatStore } from "./chat-store";
import { initChatMessage } from "./get-prompt-template";
import type { ChatSession, ChatMessage, Interview } from "./chat-store";
import type { LLMOptions } from "../../db/db-schema";
import { generateLongText } from "../standard";
import { replaceVariables } from "./replacer";

/**
 * This valibot validation ensures we get the required fields when the user
 * responds in an interview. Adjust fields as needed: for instance, if you
 * need "moderator" or other data in each call, you can add them here.
 */

/**
 * Outgoing data from the interview
 */
export const interviewRespondInputValidation = v.object({
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

export const interviewRespondOutputValidation = v.object({
  chatId: v.string(),
  interview: v.object({
    name: v.string(),
    description: v.string(),
    guidelines: v.string(),
    moderator: v.string(),
    interviewer: v.string(),
    goals: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
  }),
  lastMessage: v.object({
    role: v.union([
      v.literal("system"),
      v.literal("user"),
      v.literal("assistant"),
    ]),
    content: v.optional(v.any()),
    meta: v.optional(
      v.object({
        model: v.optional(v.string()),
        human: v.optional(v.boolean()),
        timestamp: v.optional(v.string()),
      })
    ),
  }),
});

/**
 * Generate or update the moderator's summary based on the conversation so far.
 * Now uses an LLM call to intelligently normalize, summarize, and merge the existing summary with new conversation content.
 */
async function generateModeratorSummary(
  messages: ChatMessage[],
  oldSummary: string | undefined
) {
  // Generate a consolidated text from all messages (optionally translate roles)
  const conversationText = messages
    .map((m) => {
      const role =
        m.role === "user"
          ? "User"
          : m.role === "assistant"
            ? "Assistant"
            : m.role;
      return `${role}: ${m.content}`;
    })
    .join("\n");

  // Create a summarization prompt that incorporates the existing summary
  const summarizationPrompt = `
Please intelligently summarize the following conversation. Incorporate the existing summary and combine all important information. Use a concise and normalized language.
You will use the language of the conversation.

Existing summary: "${oldSummary || "No existing summary"}"

Conversation:
-------------------------------------------
${conversationText}
-------------------------------------------
Answer (normalized summary):
  `.trim();

  // Pack the prompt into a ChatMessage to create the LLM context
  const summarizationMessage = initChatMessage(summarizationPrompt, "system", {
    human: false,
    timestamp: new Date().toISOString(),
  });

  // Call the LLM for summarization. Here we use generateLongText,
  // which internally calls the LLM to generate a longer text.
  const result = await generateLongText(
    [{ ...summarizationMessage, content: summarizationMessage.content ?? "" }],
    {
      maxTokens: 500,
      model: "openai:gpt-4o-mini",
      temperature: 0.7,
      outputType: "text",
    }
  );

  return result.text.trim();
}

/**
 * Handles the core interview logic, generating responses based on the context
 * and user input
 */
async function generateInterviewResponse(
  messages: ChatMessage[],
  userInput: string,
  session: ChatSession,
  llmOptions: LLMOptions
) {
  // If messages are empty, set up the system prompt from the perspective of the interviewer
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

  // Check if the interview goals are set; if not, prompt the user to set them
  const goalsNotSet =
    !session.state.interview?.goals ||
    session.state.interview.goals.length === 0;
  if (goalsNotSet) {
    const systemPrompt = `
      The interview goals have not been set yet. Ask the user to provide the goals they want to accomplish in this interview.
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

  // Potentially add a "moderator guidance" message
  const summarySoFar = session.state.interview?.summary || "";
  const goalsList = session.state.interview?.goals || [];
  const moderatorMessage = `
    Moderator's note:
    Current goals: ${goalsList.join(", ") || "(none)"}.
    Current summary: "${summarySoFar}".
    Please ensure the interviewer keeps the conversation focused on these goals.
  `;
  messages.push(
    initChatMessage(moderatorMessage, "system", {
      human: false,
      timestamp: new Date().toISOString(),
    })
  );

  // Replace variables and generate interviewer response
  const replacedMessages = await replaceVariables(messages, {
    user_input: userInput,
    interviewName: session.state.interview?.name,
    interviewDescription: session.state.interview?.description,
    guidelines: session.state.interview?.guidelines,
  });

  const result = await generateLongText(
    replacedMessages as any,
    {
      maxTokens: llmOptions.maxTokens,
      model: llmOptions.model,
      temperature: llmOptions.temperature,
      outputType: "text" as const,
    },
    {
      organisationId: session.organisationId ?? undefined,
      userId: session.userId ?? undefined,
    }
  );

  return result.text;
}

/**
 * Respond to an ongoing interview session.
 */
export async function respondInInterview(query: unknown): Promise<{
  chatId: string;
  interview: Interview;
  lastMessage: ChatMessage;
}> {
  // 1) Validate user input
  const parsed = v.parse(interviewRespondInputValidation, query);

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

  // 3) Generate interviewer response
  const interviewerResponse = await generateInterviewResponse(
    messages,
    parsed.user_input,
    session,
    llmOptions
  );

  // 4) Create and append the interviewer's reply
  const interviewerReply = initChatMessage(interviewerResponse, "assistant", {
    human: false,
    model: llmOptions.model,
    timestamp: new Date().toISOString(),
  });
  messages.push(interviewerReply);

  // 5) Update the moderator's summary. We merge the new summary into session state
  const newSummary = await generateModeratorSummary(
    messages,
    session.state.interview?.summary
  );

  if (!session.state.interview) {
    throw new Error("Interview state not initialized");
  }

  session.state.interview = {
    ...session.state.interview,
    summary: newSummary,
  };

  // 6) Update chat session in the database
  await chatStore.set(parsed.chatId, {
    messages,
    state: session.state,
    updatedAt: new Date().toISOString(),
  });

  // 7) Return data (including new summary) so the frontend can display it
  return {
    chatId: parsed.chatId,
    interview: session.state.interview,
    lastMessage: interviewerReply,
  };
}
