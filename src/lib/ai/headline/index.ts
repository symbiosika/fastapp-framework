import type { CoreMessage } from "ai";
import log from "../../log";
import { chatCompletion } from "../ai-sdk";
import type { UserContext } from "../ai-sdk/types";

/**
 * Create a headline from a chat
 */
export const createHeadlineFromChat = async (
  messages: CoreMessage[],
  context: UserContext
) => {
  try {
    const chat: CoreMessage[] = [
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
    const headline = await chatCompletion(chat, context, {
      maxTokens: 100,
      temperature: 0,
    });
    return {
      headline: headline.text,
    };
  } catch (error) {
    log.error(error + "");
    throw new Error("Failed to create headline from chat");
  }
};
