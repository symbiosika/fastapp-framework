import type { FileSourceType } from "../../../lib/storage";
import log from "../../../lib/log";
import { getFileFromDb } from "../../../lib/storage/db";
import { getFileFromLocalDisc } from "../../../lib/storage/local";
import { parsePdfFileAsMardown } from "./pdf";
import { knowledgeText } from "../../../lib/db/db-schema";
import { getDb } from "../../../lib/db/db-connection";
import { eq } from "drizzle-orm";
import { generateImageDescription } from "../standard";
import type { PageContent } from "./pdf/index.d";

/**
 * Helper function to parse a file and return the text content and pages if available
 */
export const parseFile = async (
  file: File,
  context: {
    organisationId: string;
    userId?: string;
    teamId?: string;
    workspaceId?: string;
  },
  options?: {
    model?: string;
    extractImages?: boolean;
  }
): Promise<{
  text: string;
  pages?: PageContent[];
  includesImages: boolean;
}> => {
  log.debug(`Parse file: ${file.name} from type ${file.type}`);

  // PDF
  if (file.type === "application/pdf") {
    // try to parse the content
    const result = await parsePdfFileAsMardown(file, context, options);

    // Create a combined text from all pages if available
    let fullText = "";
    if (result.pages && result.pages.length > 0) {
      fullText = result.pages.map((page) => page.text).join("\n\n");
    }

    return {
      text: fullText,
      pages: result.pages,
      includesImages: result.includesImages,
    };
  }

  // TXT file
  if (file.type.startsWith("text/plain")) {
    return { text: await file.text(), includesImages: false };
  }

  // Image
  else if (file.type.startsWith("image")) {
    // the the image describe by ai
    const description = await generateImageDescription(file);
    return { text: description, includesImages: false };
  } else {
    throw new Error(`Unsupported file type for parsing: ${file.type}`);
  }
};

/**
 * Parse a variety of file types
 */
export const parseDocument = async (data: {
  sourceType: FileSourceType;
  organisationId: string;
  sourceId?: string;
  sourceFileBucket?: string;
  sourceUrl?: string;
  knowledgeGroupId?: string;
  userOwned?: boolean;
  teamId?: string;
  workspaceId?: string;
  model?: string;
  extractImages?: boolean;
}) => {
  // Get the file (from DB or local disc) or content from URL
  let content: string = "";
  let pages: PageContent[] | undefined;
  let title: string;
  let docIncludesImages = false;

  if (data.sourceType === "db" && data.sourceId && data.sourceFileBucket) {
    log.debug(
      `Get file from DB: ${data.sourceId} ${data.sourceFileBucket} for organisation ${data.organisationId}`
    );
    const file = await getFileFromDb(
      data.sourceId,
      data.sourceFileBucket,
      data.organisationId
    );
    const {
      text,
      pages: filePages,
      includesImages,
    } = await parseFile(
      file,
      {
        organisationId: data.organisationId,
        teamId: data.teamId,
        workspaceId: data.workspaceId,
      },
      {
        model: data.model,
        extractImages: data.extractImages,
      }
    );
    content = text;
    pages = filePages;
    title = file.name;
    docIncludesImages = includesImages;
  } else if (
    data.sourceType === "local" &&
    data.sourceId &&
    data.sourceFileBucket
  ) {
    log.debug(
      `Get file from local disc: ${data.sourceId} ${data.sourceFileBucket} for organisation ${data.organisationId}`
    );
    const file = await getFileFromLocalDisc(
      data.sourceId,
      data.sourceFileBucket,
      data.organisationId
    );
    const {
      text,
      pages: filePages,
      includesImages,
    } = await parseFile(
      file,
      {
        organisationId: data.organisationId,
        teamId: data.teamId,
        workspaceId: data.workspaceId,
      },
      {
        model: data.model,
        extractImages: data.extractImages,
      }
    );
    content = text;
    pages = filePages;
    title = file.name;
    docIncludesImages = includesImages;
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
    log.error(
      `Can´t get file. Unsupported file source type '${data.sourceType}' or missing parameters.`
    );
    throw new Error(
      `Can´t get file. Unsupported file source type '${data.sourceType}' or missing parameters.`
    );
  }
  log.debug(`File parsed. Content length: ${content.length}`);

  return { content, pages, title, includesImages: docIncludesImages };
};
