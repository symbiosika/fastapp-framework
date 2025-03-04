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
  // Try to split by headings
  const headingRegex = /^(#{1,6}\s.*$)/gm;
  const sections = text.split(headingRegex).filter(Boolean);

  let blocks: Chunk[] = [];

  // HACK. only split by max words for now
  blocks.push({ text, header: undefined, order: 0 });

  const chunks: Chunk[] = [];
  let order = 0;

  blocks.forEach((block) => {
    const lines = block.text.split("\n");
    let currentChunk = "";
    let currentWordCount = 0;

    for (const line of lines) {
      const lineWordCount = line.trim().split(/\s+/).length;

      if (currentWordCount + lineWordCount <= MAX_WORDS_PER_CHUNK) {
        currentChunk += (currentChunk ? "\n" : "") + line;
        currentWordCount += lineWordCount;
      } else {
        if (currentChunk) {
          chunks.push({
            text: currentChunk,
            header: block.header,
            order,
          });
          order++;
        }
        currentChunk = line;
        currentWordCount = lineWordCount;
      }
    }

    if (currentChunk) {
      chunks.push({
        text: currentChunk,
        header: block.header,
        order,
      });
      order++;
    }
  });

  return chunks;
};
