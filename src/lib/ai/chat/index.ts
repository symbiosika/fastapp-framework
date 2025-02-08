/**
 * A lib to control chat flows
 */
import * as v from "valibot";
import type { ChatMessage, ChatSession } from "./chat-store";
import { chatStore } from "./chat-store";
import { initAgentsSystemPrompt, initChatMessage } from "./get-prompt-template";
import { replaceCustomPlaceholders, replaceVariables } from "./replacer";
import { customAppPlaceholders } from "../chat/custom-placeholders";
import { generateLongText } from "../standard";
import type { ChatWithTemplateReturn } from "../../../types";

import log from "../../log";

const chatInitValidation = v.object({
  userId: v.string(),
  organisationId: v.string(),
  chatId: v.optional(v.string()),
  chatSessionGroupId: v.optional(v.string()),
  initiateTemplate: v.optional(
    v.object({
      promptId: v.optional(v.string()),
      promptName: v.optional(v.string()),
      promptCategory: v.optional(v.string()),
      organisationId: v.optional(v.string()),
    })
  ),
  trigger: v.optional(
    v.object({
      next: v.boolean(),
      skip: v.boolean(),
    })
  ),
  userMessage: v.optional(v.string()),
  variables: v.optional(
    v.record(v.string(), v.union([v.string(), v.number(), v.boolean()]))
  ),
  llmOptions: v.optional(
    v.object({
      model: v.optional(v.string()),
      maxTokens: v.optional(v.number()),
      temperature: v.optional(v.number()),
    })
  ),
});
type ChatInitInput = v.InferOutput<typeof chatInitValidation>;

/**
 * Initialize a (agent) chat session
 */
const initSession = async (
  query: ChatInitInput
): Promise<{ session: ChatSession; isNewSession: boolean }> => {
  let session: ChatSession | null = null;
  let isNewSession = false;

  // if a chatId is provided -> try get the chat
  if (query.chatId) {
    session = await chatStore.get(query.chatId);
  }

  // if the session was not found or the chatId is not provided -> create a new chat
  if (!session || !query.chatId) {
    // Init the Agent System Prompt
    const agentTemplate = await initAgentsSystemPrompt(
      query.userId,
      query.organisationId,
      query.initiateTemplate ?? {}
    );
    // set as message
    const initialMessage = await initChatMessage(
      agentTemplate.template,
      "system"
    );

    let variables = {
      ...(query.variables ?? {}),
    };
    // replace the main user message
    if (query.variables?.user_input) {
      variables = { ...variables, userMessage: query.variables.user_input };
    }
    if (query.userMessage) {
      variables = { ...variables, userMessage: query.userMessage };
    }

    session = await chatStore.create({
      messages: [initialMessage],
      variables,
      context: {
        userId: query.userId,
        organisationId: query.organisationId,
        chatSessionGroupId: query.chatSessionGroupId,
      },
    });
    isNewSession = true;
  }

  return { session, isNewSession };
};

/**
 * Create a headline from a chat
 */
const createHeadlineFromChat = async (messages: ChatMessage[]) => {
  try {
    const chat = [
      {
        role: "system",
        content: `You are a helpful assistant that creates small headlines from chats.
      The headline should be a short description of the chat.
      The headline should be in the language of the chat.
      The headline should be no longer than 100 characters.
      `,
      },
      // all messages but not the first one
      ...messages.slice(1),
      {
        role: "user",
        content: `Create the headline for the given chat. No other text than the headline.`,
      },
    ];
    const headline = await generateLongText(chat as any, {
      maxTokens: 100,
      model: "openai:gpt-4o-mini",
      temperature: 0,
      outputType: "text",
    });
    return headline.text;
  } catch (error) {
    log.error(error + "");
    throw new Error("Failed to create headline from chat");
  }
};

/**
 * Chat with an agent
 */
export const chatWithAgent = async (query: ChatInitInput) => {
  // check input
  const parsedQuery = v.parse(chatInitValidation, query);
  // create context
  const context = {
    userId: parsedQuery.userId,
    organisationId: parsedQuery.organisationId,
    chatSessionGroupId: parsedQuery.chatSessionGroupId,
  };
  // init the session
  const { session, isNewSession } = await initSession(parsedQuery);

  // append the user message to the session
  const usersMessage = initChatMessage(
    session.state.variables["userMessage"] ?? "",
    "user"
  );
  const messages = [...session.messages, usersMessage];

  // replace all placeholders
  const replacedWithVariables = await replaceVariables(
    messages,
    session.state.variables
  );

  // replace other custom placeholders
  const { replacedMessages, skipThisBlock } = await replaceCustomPlaceholders(
    replacedWithVariables,
    customAppPlaceholders,
    session.state.variables,
    context
  );

  // execute LLM
  const llmResult = await generateLongText(replacedMessages as any, {
    maxTokens: parsedQuery.llmOptions?.maxTokens,
    model: parsedQuery.llmOptions?.model,
    temperature: parsedQuery.llmOptions?.temperature,
    outputType: "text",
  });
  const resultMessage = initChatMessage(llmResult.text, "assistant");
  messages.push(resultMessage);

  // if this is a new session we need to create a headline
  if (isNewSession) {
    const headline = await createHeadlineFromChat(messages);
    session.name = headline;
  }

  // save the session
  await chatStore.set(session.id, {
    messages,
    name: session.name,
    state: session.state,
  });

  const result = <ChatWithTemplateReturn>{
    chatId: session.id,
    message: resultMessage,
    meta: context,
    finished: true,
    llmOptions: query.llmOptions,
    render: {
      type: "markdown",
    },
  };

  return result;
};
