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

// Helper function to join tokens with spaces between words, preserving newlines
function joinTokensWithSpacesAndNewlines(tokens: string[]): string {
  let result = "";
  for (let i = 0; i < tokens.length; i++) {
    result += tokens[i];
    // Add a space if both current and next token are not newlines
    if (
      tokens[i] !== "\n" &&
      tokens[i + 1] !== undefined &&
      tokens[i + 1] !== "\n"
    ) {
      result += " ";
    }
  }
  return result;
}

/**
 * Helper function to split a single text string into chunks
 */
const splitSingleTextIntoChunks = (text: string): Chunk[] => {
  // Split text into tokens, wobei Zeilenumbrüche als eigene Tokens erhalten bleiben
  const tokens = text.match(/[^\s\n]+|\n/g) || [];
  let currentChunkTokens: string[] = [];
  let order = 0;
  const chunks: Chunk[] = [];
  let wordCount = 0;

  for (const token of tokens) {
    currentChunkTokens.push(token);
    // Zähle nur echte Wörter, keine Zeilenumbrüche
    if (token !== "\n") {
      wordCount++;
    }
    if (wordCount >= MAX_WORDS_PER_CHUNK) {
      chunks.push({
        text: joinTokensWithSpacesAndNewlines(currentChunkTokens),
        header: undefined,
        order: order++,
      });
      currentChunkTokens = [];
      wordCount = 0;
    }
  }
  // Add the last chunk if not empty
  if (currentChunkTokens.length > 0) {
    chunks.push({
      text: joinTokensWithSpacesAndNewlines(currentChunkTokens),
      header: undefined,
      order: order,
    });
  }
  return chunks;
};
