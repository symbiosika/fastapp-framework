import { LlamaParseReader } from "llamaindex";

const LLAMA_CLOUD_API_KEY = process.env.LLAMA_CLOUD_API_KEY;

/**
 * Parse a PDF file as markdown
 */
export const parsePdfFileAsMardown = async (
  fileContent: File
): Promise<string> => {
  // check if API key is set
  if (!LLAMA_CLOUD_API_KEY || LLAMA_CLOUD_API_KEY === "") {
    throw new Error("No API key set for LlamaParseReader.");
  }

  const reader = new LlamaParseReader({
    resultType: "markdown",
    apiKey: LLAMA_CLOUD_API_KEY,
  });

  const buffer = Buffer.from(await fileContent.arrayBuffer());
  const documents = await reader.loadDataAsContent(buffer);

  let fullText = "";
  for (const document of documents) {
    fullText += '\n\n' + document.text;
  }

  return fullText;
};
