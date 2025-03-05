/**
 * Count the number of words in a string
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Split a long text with optional <think>...</think> tags
 * into thinkings[] and content
 */
export function extractThinkingsAndContent(text?: string): {
  thinkings: string[];
  content: string;
} {
  if (!text) {
    return { thinkings: [], content: "" };
  }

  const thinkings: string[] = [];
  let content = text;

  // Regular expression to match <think>...</think> tags
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g;

  // Extract all thinking blocks
  let match;
  while ((match = thinkRegex.exec(text)) !== null) {
    thinkings.push(match[1].trim());
  }

  // Remove all thinking blocks from the content
  content = content.replace(thinkRegex, "").trim();

  return { thinkings, content };
}
