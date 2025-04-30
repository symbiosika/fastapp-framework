import type { CoreMessage } from "ai";
import type { ChatInput } from "./index";
import { getFile } from "../../storage";
import log from "../../log";
import type { ChatMessage } from "../../ai/chat-store";
import { nanoid } from "nanoid";
import { parseFile } from "../parsing";
import { addEntryToShortTermMemory } from "./tools";

/**
 * Extracts organization ID and file ID from a valid file URL
 * @param url The file URL to parse
 * @returns Object containing organisationId and fileId, or null if URL is invalid
 */
export const parseFileUrl = (
  url: string
): { organisationId: string; fileId: string } | null => {
  // Check if URL starts with http(s)
  if (!url.match(/^https?:\/\//)) {
    return null;
  }

  // Match the pattern: /api/v1/organisation/{guid}/files/{db|local}/default/{id}
  const pattern =
    /\/api\/v1\/organisation\/([0-9a-f-]+)\/files\/(db|local)\/default\/([0-9a-f-]+)/i;
  const match = url.match(pattern);

  if (!match) {
    return null;
  }

  return {
    organisationId: match[1],
    fileId: match[3],
  };
};

/**
 * Retrieves a file from storage using a file URL
 * @param url The file URL to retrieve
 * @param storageType The type of storage to use (db or local)
 * @returns The file content
 */
export const getFileFromUrl = async (
  url: string,
  storageType: "db" | "local" = "db"
) => {
  const parsed = parseFileUrl(url);

  if (!parsed) {
    throw new Error("Invalid file URL format");
  }

  return await getFile(
    parsed.fileId,
    "default",
    parsed.organisationId,
    storageType
  );
};

/**
 * Converts artifacts into ChatMessages
 * @param artifacts Array of artifacts from the chat input
 * @param context Context containing organisationId and userId
 * @returns Array of ChatMessages containing the artifact content
 */
export async function getArtifacts(
  artifacts: ChatInput["artifacts"],
  context: { organisationId: string; userId: string; chatId: string }
): Promise<ChatMessage[]> {
  if (!artifacts || artifacts.length === 0) {
    return [];
  }

  const messages: ChatMessage[] = [];

  for (const artifact of artifacts) {
    // Handle image artifacts
    if (artifact.type === "image" && artifact.url) {
      try {
        // Try to get the file content
        const file = await getFileFromUrl(artifact.url);

        // Convert file to base64 using Node.js Buffer
        const arrayBuffer = await file.arrayBuffer();
        const base64Content = `data:${file.type};base64,${Buffer.from(arrayBuffer).toString("base64")}`;

        // Add image to imageArtifacts to short term memory
        addEntryToShortTermMemory(context.chatId, {
          inputArtifacts: [
            {
              type: "image",
              file,
            },
          ],
        });

        messages.push({
          role: "user",
          content: [
            {
              type: "image",
              image: base64Content,
              mimeType: file.type,
            },
          ],
          meta: {
            id: nanoid(10),
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        log.error(`Error getting file from URL ${artifact.url} ${error}`);
        throw new Error("Error getting file from URL");
      }
    } else {
      try {
        // Try to get the file content
        const file = await getFileFromUrl(artifact.url);

        // Parse file
        const parsedFile = await parseFile(file, {
          organisationId: context.organisationId,
          userId: context.userId,
        });

        messages.push({
          role: "assistant",
          content: parsedFile.text,
          meta: {
            id: nanoid(10),
            visible: false,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        log.error(`Error getting file from URL ${artifact.url} ${error}`);
        throw new Error("Error getting file from URL");
      }
    }
  }

  return messages;
}
