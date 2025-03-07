import type { Chunk } from "../../types/chunks";

const MAX_WORDS_PER_CHUNK = 500;
/**
 * Function to split text into logical sections and chunks
 *
 * - Try to split by headings
 * - If no headings are found, split by paragraphs
 * - Split blocks that are too long
 */
export const splitTextIntoSectionsOrChunks = (text: string): Chunk[] => {
  // Zähle die Wörter im Text
  const totalWords = text.trim().split(/\s+/).length;

  // Wenn der Text kurz genug ist, gib ihn als einen Chunk zurück
  if (totalWords <= MAX_WORDS_PER_CHUNK) {
    return [{ text, header: undefined, order: 0 }];
  }

  // Teile den Text in Chunks auf
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

  // Füge den letzten Chunk hinzu, wenn er nicht leer ist
  if (currentChunkWords.length > 0) {
    chunks.push({
      text: currentChunkWords.join(" "),
      header: undefined,
      order: order,
    });
  }

  return chunks;
};
