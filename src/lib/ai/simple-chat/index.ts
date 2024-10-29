import { chatStore } from "../smart-chat/chat-history";
import { generateResponseFromUserMessage } from "../generation";
import log from "../../log";
import type { ServerChatItem } from "../smart-chat/shared-types";

/**
 * Process a single message using the template parsing functionality
 * while maintaining chat history.
 */
export const simpleChat = async (
  chatId: string | undefined,
  userMessage: string
): Promise<ServerChatItem> => {
  // Get or create chat session
  const session = chatStore.get(chatId);

  try {
    // Parse the user message as a template
    const answer = await generateResponseFromUserMessage({
      role: "user",
      content: userMessage,
    });

    // Add to history
    session.messages.push({
      role: "assistant",
      content: answer.text,
    });

    // Log the interaction
    await log.debug(session.id, `SimpleChat Len:${session.messages.length}`);
    await log.logAChat(session.id, ...session.messages);

    return {
      chatId: session.id,
      role: "assistant",
      content: answer.text,
      renderType: "markdown",
    };
  } catch (error) {
    await log.error(session.id, "Error in simple chat:", error + "");
    return {
      chatId: session.id,
      role: "assistant",
      content: "An error occurred while processing your message: " + error,
      renderType: "box",
      type: "error",
    };
  }
};
