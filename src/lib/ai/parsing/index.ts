import type { FileSourceType } from "../../../lib/storage";
import log from "../../../lib/log";
import { getFileFromDb } from "../../../lib/storage/db";
import { getFileFromLocalDisc } from "../../../lib/storage/local";
import { parsePdfFileAsMardown } from "./pdf";
import { knowledgeText } from "../../../lib/db/db-schema";
import { getDb } from "../../../lib/db/db-connection";
import { eq } from "drizzle-orm";
import { generateImageDescription } from "../standard";

/**
 * Helper function to parse a file and return the text content
 */
export const parseFile = async (file: File): Promise<{ text: string }> => {
  log.debug(`Parse file: ${file.name} from type ${file.type}`);

  // PDF
  if (file.type === "application/pdf") {
    // try tp parse the content
    const markdown = await parsePdfFileAsMardown(file);
    return { text: markdown };
  }

  // Image
  else if (file.type.startsWith("image")) {
    // the the image describe by ai
    const description = await generateImageDescription(file);
    await log.debug(`Image description: ${description}`);
    return { text: description };
  } else {
    throw new Error(`Unsupported file type for parsing: ${file.type}`);
  }
};

/**
 * Parse a variety of file types
 */
export const parseDocument = async (data: {
  sourceType: FileSourceType;
  sourceId?: string;
  sourceFileBucket?: string;
  sourceUrl?: string;
}) => {
  // Get the file (from DB or local disc) or content from URL
  let content: string;
  let title: string;
  if (data.sourceType === "db" && data.sourceId && data.sourceFileBucket) {
    log.debug(`Get file from DB: ${data.sourceId} ${data.sourceFileBucket}`);
    const file = await getFileFromDb(data.sourceId, data.sourceFileBucket);
    const { text } = await parseFile(file);
    content = text;
    title = file.name;
  } else if (
    data.sourceType === "local" &&
    data.sourceId &&
    data.sourceFileBucket
  ) {
    log.debug(
      `Get file from local disc: ${data.sourceId} ${data.sourceFileBucket}`
    );
    const file = await getFileFromLocalDisc(
      data.sourceId,
      data.sourceFileBucket
    );
    const { text } = await parseFile(file);
    content = text;
    title = file.name;
  } else if (data.sourceType === "url" && data.sourceUrl) {
    log.debug(`Get file from URL: ${data.sourceUrl}`);
    content = "";
    title = "";
  } else if (data.sourceType === "text") {
    log.debug(`Get file from TEXT`);
    const dbResults = await getDb()
      .select()
      .from(knowledgeText)
      .where(eq(knowledgeText.id, data.sourceId!));
    if (dbResults.length === 0) {
      throw new Error(`Knowledge text not found: ${data.sourceId}`);
    }
    content = dbResults[0].text;
    title = dbResults[0].title;
  } else {
    throw new Error(
      `Can´t get file. Unsupported file source type '${data.sourceType}' or missing parameters.`
    );
  }
  log.debug(`File parsed. Content length: ${content.length}`);
  log.debug(`Original content:\n${content}`);

  return { content, title };
};
