import type { Chunk } from "./types";

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

  // if (sections.length > 1) {
  //   // Rejoin headings with their content
  //   for (let i = 0; i < sections.length; i += 2) {
  //     const header = sections[i];
  //     const content = sections[i + 1] || "";
  //     blocks.push({ text: header + "\n" + content, header, order: 0 });
  //   }
  // } else {
  //   // No headings found, split by paragraphs
  //   blocks = text
  //     .split(/\n\s*\n/)
  //     .filter(Boolean)
  //     .map((text) => ({ text, header: undefined, order: 0 }));
  // }

  // Split blocks that are too long
  // Add the order to each block

  const chunks: Chunk[] = [];
  let order = 0;

  blocks.forEach((block) => {
    const words = block.text.split(/\s+/);
    if (words.length <= MAX_WORDS_PER_CHUNK) {
      chunks.push({
        text: block.text,
        header: block.header,
        order,
      });
      order++;
    } else {
      // Split block into smaller chunks
      for (let i = 0; i < words.length; i += MAX_WORDS_PER_CHUNK) {
        const chunk = words.slice(i, i + MAX_WORDS_PER_CHUNK).join(" ");
        chunks.push({
          text: chunk,
          header: block.header,
          order,
        });
        order++;
      }
    }
  });

  return chunks;
};
