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
import type { ChunkWithEmbedding } from "../../types/chunks";
import {
  knowledgeChunks,
  knowledgeEntry,
  type KnowledgeChunksInsert,
  type KnowledgeEntryInsert,
  knowledgeEntryFilters,
} from "../../db/schema/knowledge";
import { parseDocument, parseFile } from "../parsing";
import { nanoid } from "nanoid";
import { upsertFilter } from "./knowledge-filters";
import { eq } from "drizzle-orm";

/**
 * Helper function to store a knowledge entry in the database
 */
export const storeKnowledgeEntry = async (
  data: KnowledgeEntryInsert,
  filters: Record<string, string>
) => {
  const db = getDb();

  // Store the main entry
  const [entry] = await db.insert(knowledgeEntry).values(data).returning();

  if (!entry) {
    throw new Error("Error storing knowledge entry");
  }

  // Handle filters
  const filterPromises = Object.entries(filters).map(
    async ([category, name]) => {
      const filterId = await upsertFilter(category, name, data.organisationId);
      return db.insert(knowledgeEntryFilters).values({
        knowledgeEntryId: entry.id,
        knowledgeFilterId: filterId,
      });
    }
  );
  await Promise.all(filterPromises);

  return entry;
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
  organisationId: string;
  title: string;
  text: string;
  filters?: Record<string, string>;
  metadata?: Record<string, string | number | boolean | undefined>;
  sourceType?: FileSourceType;
  sourceFileBucket?: string;
  sourceId?: string;
  sourceExternalId?: string;
  sourceUrl?: string;
  userId?: string;
  teamId?: string;
  workspaceId?: string;
  knowledgeGroupId?: string;
  userOwned?: boolean;
}) => {
  const title = data.title + "-" + nanoid(4);

  // Split the content into chunks
  const chunks = splitTextIntoSectionsOrChunks(data.text);

  // Generate embeddings for all chunks
  const allEmbeddings: ChunkWithEmbedding[] = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const embedding = await generateEmbedding(chunk.text, undefined, {
          organisationId: data.organisationId,
          userId: data.userId,
        });
        return { ...chunk, embedding };
      } catch (e) {
        log.error(`Error generating embedding for chunk: ${chunk.text}`);
        log.debug(`Chunk length: ${chunk.text.length}`);
        throw new Error(
          "Error generating embedding for Chunk with text-length: " +
            chunk.text.length +
            ". " +
            e
        );
      }
    })
  );
  log.debug(`Embeddings generated. Chunks: ${chunks.length}`);

  // merge metadata
  const meta = {
    ...(data.metadata ?? {}),
    textLength: data.text.length,
  };

  // Store the main entry in the database
  await log.debug(`Store knowledge entry: ${title}`);
  const knowledgeEntry = await storeKnowledgeEntry(
    {
      ...data,
      organisationId: data.organisationId,
      name: title,
      sourceType: data.sourceType || ("text" as const),
      meta,
      userId: data.userId,
      teamId: data.teamId,
      workspaceId: data.workspaceId,
      knowledgeGroupId: data.knowledgeGroupId,
      userOwned: data.userOwned,
    },
    data.filters || {}
  );

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
  return {
    id: knowledgeEntry.id,
    ok: true,
  };
};

/**
 * Extract knowledge from a file and store it in the database
 */
export const extractKnowledgeFromExistingDbEntry = async (data: {
  organisationId: string;
  sourceType: FileSourceType;
  sourceId?: string;
  sourceFileBucket?: string;
  sourceUrl?: string;
  filters?: Record<string, string>;
  metadata?: Record<string, string | number | boolean | undefined>;
  userId?: string;
  teamId?: string;
  workspaceId?: string;
  knowledgeGroupId?: string;
  userOwned?: boolean;
}) => {
  // Get the file (from DB or local disc) or content from URL
  let { content, title } = await parseDocument(data);

  return extractKnowledgeFromText({
    title,
    text: content,
    filters: data.filters,
    metadata: data.metadata,
    sourceType: data.sourceType,
    sourceFileBucket: data.sourceFileBucket,
    sourceId: data.sourceId,
    sourceUrl: data.sourceUrl,
    organisationId: data.organisationId,
    userId: data.userId,
    teamId: data.teamId,
    workspaceId: data.workspaceId,
    knowledgeGroupId: data.knowledgeGroupId,
    userOwned: data.userOwned,
  });
};

/**
 * Check if an external source knowledge entry already exists
 */
export const checkIfExternalSourceKnowledgeEntryExists = async (
  data: {
    organisationId: string;
    sourceExternalId?: string;
  },
  deleteIfExists?: boolean
) => {
  if (!data.sourceExternalId) {
    return false;
  }
  const entry = await getDb().query.knowledgeEntry.findFirst({
    where: eq(knowledgeEntry.sourceExternalId, data.sourceExternalId),
  });
  if (entry) {
    if (deleteIfExists) {
      await getDb()
        .delete(knowledgeEntry)
        .where(eq(knowledgeEntry.id, entry.id));
    }
    return true;
  }
  return false;
};

/**
 * Extract knowledge from a file or text and store it in the database
 */
export const extractKnowledgeInOneStep = async (
  data: {
    organisationId: string;
    filters?: Record<string, string>;
    teamId?: string;
    workspaceId?: string;
    knowledgeGroupId?: string;
    userOwned?: boolean;
    file?: File;
    data?: {
      title: string;
      text: string;
    };
    meta?: {
      sourceUri: string;
      sourceId: string;
    };
  },
  overwrite?: boolean
) => {
  const bucket = "default";

  // Check if the external source knowledge entry already exists
  await checkIfExternalSourceKnowledgeEntryExists(
    {
      organisationId: data.organisationId,
      sourceExternalId: data.meta?.sourceId,
    },
    overwrite
  );

  // if the file is provided, extract knowledge from it
  if (data.file) {
    // 1. parse file content
    const parsed = await parseFile(data.file);

    // 2. Extract knowledge
    const result = await extractKnowledgeFromText({
      organisationId: data.organisationId,
      title: data.file.name ?? "Unknown",
      text: parsed.text,
      filters: data.filters,
      teamId: data.teamId,
      workspaceId: data.workspaceId,
      knowledgeGroupId: data.knowledgeGroupId,
      userOwned: data.userOwned,
      sourceType: "external",
      sourceExternalId: data.meta?.sourceId ?? data.file.name,
      sourceFileBucket: bucket,
      sourceUrl: data.meta?.sourceUri ?? data.file.name,
    });
    return result;
  }
  // if the text is provided, extract knowledge from it
  else if (data.data) {
    return extractKnowledgeFromText({
      organisationId: data.organisationId,
      title: data.data.title,
      text: data.data.text,
      filters: data.filters,
      teamId: data.teamId,
      workspaceId: data.workspaceId,
      knowledgeGroupId: data.knowledgeGroupId,
      userOwned: data.userOwned,
      sourceExternalId: data.meta?.sourceId ?? data.data.title,
      sourceType: "external",
      sourceFileBucket: bucket,
      sourceUrl: data.meta?.sourceUri ?? data.data.title,
    });
  }
  // if no file and no text is provided, throw an error
  else {
    throw new Error("No file or text provided");
  }
};
