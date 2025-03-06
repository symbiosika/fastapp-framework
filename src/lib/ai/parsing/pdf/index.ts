import { parsePdfFileAsMardownLlama } from "./llama-api";
import { parsePdfFileAsMardownLocal } from "./local-service";

export const parsePdfFileAsMardown = async (
  fileContent: File
): Promise<{
  text: string;
}> => {
  if (process.env.PDF_PARSER_SERVICE === "local") {
    return parsePdfFileAsMardownLocal(fileContent);
  }
  return parsePdfFileAsMardownLlama(fileContent);
};
