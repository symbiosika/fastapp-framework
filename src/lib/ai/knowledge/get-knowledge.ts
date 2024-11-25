import { getDb } from "../../../lib/db/db-connection";
import { and, eq, inArray, SQL, sql } from "drizzle-orm";
import {
  knowledgeChunks,
  knowledgeEntry,
  knowledgeEntryFilters,
  knowledgeFilters,
  knowledgeText,
  type KnowledgeEntrySelect,
} from "../../db/schema/knowledge";
import log from "../../../lib/log";
import { deleteFileFromDB } from "../../storage/db";
import { deleteFileFromLocalDisc } from "../../storage/local";

type KnowledgeQuery = {
  id?: string[];
  names?: string[];
  chunkCount?: number;
  chunkOffset?: number;
  filters?: Record<string, string[]>;
};

type KnowledgeEntryWithChunks = typeof knowledgeEntry.$inferSelect & {
  knowledgeChunks: (typeof knowledgeChunks.$inferSelect)[];
};

type PlainKnowledgetEntry = {
  text: string;
  knowledgeEntryId: string;
  chunkId: string;
};

const getKnowledgeWithChunks = async (
  id: string,
  chunkOffset?: number,
  chunkCount?: number
) => {
  const e = await getDb().query.knowledgeEntry.findMany({
    where: eq(knowledgeEntry.id, id),
  });
  const chunks = await getDb().query.knowledgeChunks.findMany({
    where: eq(knowledgeChunks.knowledgeEntryId, id),
    orderBy: (knowledgeChunks, { asc }) => [asc(knowledgeChunks.order)],
    offset: chunkOffset,
    limit: chunkCount,
  });
  return { ...e[0], knowledgeChunks: chunks };
};

const getKnowledgeWithChunksWithConditions = async (
  where: SQL<unknown> | undefined
) => {
  const entries = await getDb().query.knowledgeEntry.findMany({
    where,
  });

  const entriesWithChunks = await Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      knowledgeChunks: await getDb().query.knowledgeChunks.findMany({
        where: eq(knowledgeChunks.knowledgeEntryId, entry.id),
        orderBy: (knowledgeChunks, { asc }) => [asc(knowledgeChunks.order)],
      }),
    }))
  );

  return entriesWithChunks;
};

/**
 * Get knowledge by an id, name(s) or filters from DB
 * Will return the knowledge as an array with the original IDs.
 */
export const getKnowledge = async (
  query: KnowledgeQuery
): Promise<KnowledgeEntryWithChunks[]> => {
  // Query based on direct ID(s)
  if (query.id) {
    await log.debug(`Getting knowledge by ids: ${query.id}`);

    const entries = await Promise.all(
      query.id.map((id) =>
        getKnowledgeWithChunks(id, query.chunkOffset, query.chunkCount)
      )
    );
    return entries;
  }

  // Query based on names or categories from fine-tuning data
  const conditions = [];
  if (query.names?.length) {
    await log.debug(`Getting knowledge filteredby names: ${query.names}`);
    conditions.push(inArray(knowledgeEntry.name, query.names));
  }
  if (query.filters) {
    await log.debug(
      `Getting knowledge filtered by: ${JSON.stringify(query.filters)}`
    );

    for (const [category, values] of Object.entries(query.filters)) {
      if (values.length) {
        const subquery = getDb()
          .select({ id: knowledgeEntryFilters.knowledgeEntryId })
          .from(knowledgeEntryFilters)
          .innerJoin(
            knowledgeFilters,
            eq(knowledgeFilters.id, knowledgeEntryFilters.knowledgeFilterId)
          )
          .where(
            and(
              eq(knowledgeFilters.category, category),
              inArray(knowledgeFilters.name, values)
            )
          );

        conditions.push(sql`${knowledgeEntry.id} IN (${subquery})`);
      }
    }
  }

  if (conditions.length === 0) {
    await log.debug(
      "No conditions to filter knowledge base are provided. At least one filter must be provided."
    );
    throw new Error(
      "No conditions to filter knowledge base are provided. At least one filter must be provided."
    );
  }

  let where;
  if (conditions.length > 1) {
    where = conditions[0];
  } else {
    where = and(...conditions);
  }

  const entriesWithChunks = await getKnowledgeWithChunksWithConditions(where);
  await log.debug(`Return ${entriesWithChunks.length} knowledge entries`);
  return entriesWithChunks;
};

/**
 * Get the full knowledge entry with all chunks
 */
export const getPlainKnowledge = async (
  query: KnowledgeQuery
): Promise<PlainKnowledgetEntry[]> => {
  const knowledge = await getKnowledge(query);
  const plainKnowledge: PlainKnowledgetEntry[] = [];
  for (const entry of knowledge) {
    for (const chunk of entry.knowledgeChunks) {
      plainKnowledge.push({
        text: chunk.text,
        knowledgeEntryId: entry.id,
        chunkId: chunk.id,
      });
    }
  }
  return plainKnowledge;
};

/**
 * Get the knowledgebase entries from DB
 * with pagination
 * without the chunks
 */
export const getKnowledgeEntries = async (query?: {
  limit: number;
  page: number;
}): Promise<KnowledgeEntrySelect[]> => {
  return await getDb().query.knowledgeEntry.findMany({
    limit: query?.limit ?? 100,
    offset: query?.page ? query.page * query.limit : undefined,
    orderBy: (knowledgeEntry, { desc }) => [desc(knowledgeEntry.createdAt)],
  });
};

/**
 * Delete a knowledge entry by ID
 */
export const deleteKnowledgeEntry = async (
  id: string,
  deleteSource = false
) => {
  // also delete the source if requested
  if (deleteSource) {
    const e = await getDb().query.knowledgeEntry.findFirst({
      where: eq(knowledgeEntry.id, id),
    });
    if (e?.sourceType === "db" && e.sourceId && e.sourceFileBucket) {
      await deleteFileFromDB(e.sourceId, e.sourceFileBucket);
    } else if (e?.sourceType === "local" && e.sourceId && e.sourceFileBucket) {
      await deleteFileFromLocalDisc(e.sourceId, e.sourceFileBucket);
    } else if (e?.sourceType === "text") {
      await getDb().delete(knowledgeText).where(eq(knowledgeText.id, id));
    }
  }
  await getDb().delete(knowledgeEntry).where(eq(knowledgeEntry.id, id));
};

/**
 * Get the full plain source text/documents for a knowledge entry id
 */
export const getFullSourceDocumentsForKnowledgeEntry = async (id: string) => {
  const entry = await getDb().query.knowledgeEntry.findFirst({
    where: eq(knowledgeEntry.id, id),
  });
  const chunks = await getDb().query.knowledgeChunks.findMany({
    where: eq(knowledgeChunks.knowledgeEntryId, id),
    orderBy: (knowledgeChunks, { asc }) => [asc(knowledgeChunks.order)],
  });
  const text = chunks.map((chunk) => chunk.text).join("\n");
  return {
    entry,
    text,
  };
};
