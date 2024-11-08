/*
 This library contains functions to extract knowledge from textes and store them in different ways.
 
 It will get an in input from an already uploaded file and extract the knowledge from it.

 This will be done in a few steps:
 - Get the input file and parse it into text/markdown
 - Try to split the text into logical sections. This can be done for example by headings. Output = blocks of texts
 - If no sections are found we will still have a long text. Try to split it by paragraphs then. Output = blocks of texts
 - Check the word count of each block. If it is too high we will split it into smaller chunks. Output = Chunks
 - For each chunk create a knowledge object.
    - Create a summary of the chunk?
*/
import { getDb } from "../../db/db-connection";
import log from "../../log";
import type { FileSourceType } from "../../storage";
import { generateEmbedding } from "../standard";
import { splitTextIntoSectionsOrChunks } from "./splitter";
import type { ChunkWithEmbedding } from "./types";
import {
  knowledgeChunks,
  knowledgeEntry,
  knowledgeText,
  type KnowledgeChunksInsert,
  type KnowledgeEntryInsert,
} from "../../db/schema/knowledge";
import { parseDocument } from "../parsing";
import { nanoid } from "nanoid";
import { getMarkdownFromUrl } from "../parsing/url";

/**
 * Helper function to store a knowledge entry in the database
 */
const storeKnowledgeEntry = async (data: KnowledgeEntryInsert) => {
  const entry = await getDb().insert(knowledgeEntry).values(data).returning();
  if (entry.length === 0) {
    throw new Error("Error storing knowledge entry");
  }
  return entry[0];
};

/**
 * Helper to store a knowledge chunk in the database
 */
const storeKnowledgeChunk = async (data: KnowledgeChunksInsert) => {
  await getDb().insert(knowledgeChunks).values(data);
};

/**
 * Extract knowledge from a file and store it in the database
 */
export const extractKnowledgeFromText = async (data: {
  fileSourceType: FileSourceType;
  fileSourceId?: string;
  fileSourceBucket?: string;
  fileSourceUrl?: string;
  category1?: string;
  category2?: string;
  category3?: string;
}) => {
  // Get the file (from DB or local disc) or content from URL
  let { content, title } = await parseDocument(data);
  title = title + "-" + nanoid(4);

  // Split the content into chunks
  const chunks = splitTextIntoSectionsOrChunks(content);

  // Generate embeddings for all chunks
  const allEmbeddings: ChunkWithEmbedding[] = await Promise.all(
    chunks.map(async (chunk) => {
      const embedding = await generateEmbedding(chunk.text);
      return { ...chunk, embedding };
    })
  );
  log.debug(`Embeddings generated. Chunks: ${chunks.length}`);

  // Store the main entry in the database
  await log.debug(`Store knowledge entry: ${title}`);
  const knowledgeEntry = await storeKnowledgeEntry({
    ...data,
    name: title,
    category1: data.category1 || undefined,
    category2: data.category2 || undefined,
    category3: data.category3 || undefined,
  });

  // Store the chunks in the database
  await log.debug(`Store knowledge chunks: ${allEmbeddings.length}`);
  await Promise.all(
    allEmbeddings.map((e) =>
      storeKnowledgeChunk({
        knowledgeEntryId: knowledgeEntry.id,
        text: e.text,
        header: e.header,
        order: e.order,
        embeddingModel: e.embedding.model,
        textEmbedding: e.embedding.embedding,
      })
    )
  );
  await log.debug(`Knowledge chunks stored.`);
  return {
    ok: true,
  };
};

/**
 * Add knowledge from an URL
 */
export const addKnowledgeFromUrl = async (url: string) => {
  const markdown = await getMarkdownFromUrl(url);
  log.debug(`Markdown: ${markdown.slice(0, 100)}`);

  // insert in DB as text knowledge entry
  const e = await getDb()
    .insert(knowledgeText)
    .values({
      text: markdown,
      title: url,
    })
    .returning({
      id: knowledgeText.id,
      title: knowledgeText.title,
      createdAt: knowledgeText.createdAt,
    });

  return e;
};

/**
 * Add plain knowledge text to the database
 */
export const addPlainKnowledgeText = async (text: string, title?: string) => {
  const e = await getDb()
    .insert(knowledgeText)
    .values({ text, title })
    .returning();
  return e[0];
};
