import { chatStore } from "../chat-store";
import { chatCompletion } from "../ai-sdk";
import log from "../../log";

/**
 * Generates a summary of a chat conversation
 * @param chatId - The ID of the chat session
 * @param organisationId - The organisation ID for security validation
 * @returns A summary of the chat history in the same language as the conversation
 */
export async function generateChatSummary(
  userId: string,
  chatId: string,
  organisationId: string
): Promise<{
  summary: string;
  fullTextSummary: string;
}> {
  try {
    // Get chat history
    const chatHistory = await chatStore.getChatHistory(chatId);

    // Filter out system messages and extract conversation content
    const conversationMessages = chatHistory
      .filter((msg) => msg.role !== "system" && msg.content)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    if (!conversationMessages.trim()) {
      return {
        summary: "No meaningful conversation content found.",
        fullTextSummary: `ChatId: ${chatId}\nNo meaningful conversation content found.`,
      };
    }

    // Create prompt for summary generation
    const summaryPrompt = `Please create a concise summary of the following conversation. 
Keep the summary to approximately 500 characters. 
Write the summary in the same language as the conversation.
If the conversation is in German, write the summary in German.
If the conversation is in English, write the summary in English.

Conversation:
${conversationMessages}

Summary:`;

    // Generate summary using AI
    const response = await chatCompletion(
      [
        {
          role: "user",
          content: summaryPrompt,
        },
      ],
      {
        userId: userId,
        organisationId: organisationId,
      },
      {
        maxTokens: 150, // Limit tokens to keep summary concise
        temperature: 0.3, // Lower temperature for more focused summaries
      }
    );

    const summary = response.text?.trim() || "Summary could not be generated.";

    // Ensure summary is approximately 500 characters
    if (summary.length > 500) {
      return {
        summary: summary.substring(0, 497) + "...",
        fullTextSummary: `ChatId: ${chatId}\n${summary}`,
      };
    }

    log.logCustom({ name: chatId }, `Generated summary for chat ${chatId}`);
    return {
      summary: summary,
      fullTextSummary: `ChatId: ${chatId}\n${summary}`,
    };
  } catch (error) {
    log.error(`Error generating chat summary for ${chatId}`, error + "");
    throw new Error(`Failed to generate chat summary: ${error}`);
  }
}
