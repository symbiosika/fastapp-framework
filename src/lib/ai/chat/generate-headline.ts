import { chatCompletion } from "../ai-sdk";
import log from "../../log";
import type { ChatMessage } from "./chat-store";
import type { UserContext } from "../ai-sdk/types";
/**
 * Create a headline from a chat
 */
export const createHeadlineFromChat = async (
  messages: ChatMessage[],
  context: UserContext
) => {
  try {
    const chat = [
      {
        role: "system",
        content: `You are a helpful assistant that creates small headlines from chats.
        The headline should be a short description of the chat.
        The headline should be in the language of the chat.
        The headline should be no longer than 100 characters.
        The headline should be a single sentence and never contains markdown syntax or hashtags.
        `,
      },
      // all messages but not the first one
      ...messages.slice(1),
      {
        role: "user",
        content: `Create the headline for the given chat. No other text than the headline.`,
      },
    ];
    const headline = await chatCompletion(
      chat as any,
      {
        organisationId: context.organisationId,
        userId: context.userId,
      },
      {
        maxTokens: 100,
        providerAndModelName: "openai:gpt-4o-mini",
        temperature: 0,
      }
    );
    return headline.text;
  } catch (error) {
    log.error(error + "");
    throw new Error("Failed to create headline from chat");
  }
};
