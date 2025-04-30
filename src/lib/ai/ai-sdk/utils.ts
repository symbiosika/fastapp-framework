import type { CoreMessage } from "ai";

/**
 * Helper to encode a File object as a base64 string.
 */
export async function encodeImageFromFile(file: File): Promise<string> {
  const imageBuffer = await file.arrayBuffer();
  return Buffer.from(imageBuffer).toString("base64");
}

/**
 * Removes markdown image URLs from a string that contain '/api/v1/' and '/files/db/default/' patterns.
 */
export function removeMarkdownImageUrls(text: string): string {
  const regex = /!\[.*?\]\(.*?\/api\/v1\/.*?\/files\/db\/default\/.*?\)/g;
  return text.replace(regex, "");
}

/**
 * Drop all markdown image urls from an array of messages
 */
export function dropMarkdownImageUrls(messages: CoreMessage[]): CoreMessage[] {
  return messages.map((message) => {
    const clonedMessage = { ...message };

    if (typeof clonedMessage.content === "string") {
      clonedMessage.content = removeMarkdownImageUrls(clonedMessage.content);
    } else if (typeof clonedMessage.content === "object") {
      // Handle complex content structures without modifying the original
      // This approach avoids type errors by creating a new object
      clonedMessage.content = JSON.parse(
        removeMarkdownImageUrls(JSON.stringify(clonedMessage.content))
      );
    }

    return clonedMessage;
  });
}
