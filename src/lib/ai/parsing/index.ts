import { embeddings } from "../../db/db-schema";
import { getDb } from "../../db/db-connection";
import { files } from "../../db/db-schema";
import { parsePdfFileAsMardown } from "./pdf";
import { generateEmbedding } from "../standard/openai";
import { eq } from "drizzle-orm";

/**
 * A PDF parser that tries to extract the text from a PDF file and add it to the database
 * will generate markdown from the PDF
 * no-role-check: no need to check role here since this is always called after a role check
 */
export const parseFileContentAndAddToDb = async (id: string, file: File) => {
  try {
    const rows = await getDb().select().from(files).where(eq(files.id, id));
    const data = rows[0] ?? undefined;

    if (!data) {
      throw new Error("File not found");
    }
    // console.log('Parsing file content and adding to DB', data);

    let text = "",
      embeddingModel = "",
      textEmbedding: any = [];

    // PDF
    if (data.fileType === "pdf") {
      // try tp parse the content
      const markdown = await parsePdfFileAsMardown(file);
      // add this markdown to the database incl. embeddings
      const embed = await generateEmbedding(markdown);
      // save the embedding and model
      text = markdown;
      textEmbedding = embed.embedding;
      embeddingModel = embed.model;
    }

    // Image
    else if (data.fileType === "image") {
      // the the image describe by ai
      const description = ""; // HACK: await parseImage(filePath);
      // add this description to the database
      const embed = await generateEmbedding(description);
      // save the embedding and model
      text = description;
      textEmbedding = embed.embedding;
      embeddingModel = embed.model;
    }

    // add the text to the database
    if (text !== "") {
      await getDb().insert(embeddings).values({
        sourceTable: "files",
        sourceId: id,
        order: 0,
        section: "all",
        text,
        embeddingModel,
        textEmbedding,
      });
    }
  } catch (e) {
    throw new Error("Error parsing file content and adding to DB: " + e);
  }
};
