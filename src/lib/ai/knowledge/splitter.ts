import type { Chunk } from "../../types/chunks";
import type { PageContent } from "../parsing/pdf/index.d";

const MAX_WORDS_PER_CHUNK = 500;
/**
 * Function to split text into logical sections and chunks
 *
 * - Handles page-based content
 * - Try to split by headings
 * - If no headings are found, split by paragraphs
 * - Split blocks that are too long
 */
export const splitTextIntoSectionsOrChunks = (
  textOrPages: string | PageContent[]
): Chunk[] => {
  // Handle both string and pages array
  if (typeof textOrPages === "string") {
    return splitSingleTextIntoChunks(textOrPages);
  }

  // Handle pages array
  const pages = textOrPages;
  const chunks: Chunk[] = [];
  let globalOrder = 0;

  // Process each page and maintain page information
  for (const page of pages) {
    const pageChunks = splitSingleTextIntoChunks(page.text);

    // Add page information to each chunk
    for (const chunk of pageChunks) {
      chunks.push({
        ...chunk,
        order: globalOrder++,
        meta: {
          ...(chunk.meta || {}),
          page: page.page,
        },
      });
    }
  }

  return chunks;
};

/**
 * Helper function to split a single text string into chunks
 */
const splitSingleTextIntoChunks = (text: string): Chunk[] => {
  // Count words in text
  const totalWords = text.trim().split(/\s+/).length;

  // If text is short enough, return it as one chunk
  if (totalWords <= MAX_WORDS_PER_CHUNK) {
    return [{ text, header: undefined, order: 0 }];
  }

  // Split text into chunks
  const chunks: Chunk[] = [];
  const words = text.split(/\s+/);
  let currentChunkWords: string[] = [];
  let order = 0;

  for (const word of words) {
    currentChunkWords.push(word);

    if (currentChunkWords.length >= MAX_WORDS_PER_CHUNK) {
      chunks.push({
        text: currentChunkWords.join(" "),
        header: undefined,
        order: order++,
      });
      currentChunkWords = [];
    }
  }

  // Add the last chunk if not empty
  if (currentChunkWords.length > 0) {
    chunks.push({
      text: currentChunkWords.join(" "),
      header: undefined,
      order: order,
    });
  }

  return chunks;
};
