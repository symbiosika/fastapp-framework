import { getDb } from "../../../lib/db/db-connection";
import { and, eq, inArray, SQL, type SQLWrapper } from "drizzle-orm";
import { knowledgeChunks, knowledgeEntry } from "../../db/schema/knowledge";
import log from "../../../lib/log";

type KnowledgeQuery = {
  id?: string[];
  names?: string[];
  category1?: string[];
  category2?: string[];
  category3?: string[];
  chunkCount?: number;
  chunkOffset?: number;
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
 * Get knowledge by an id, name(s) or categories from DB
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
  if (query.category1?.length) {
    await log.debug(
      `Getting knowledge filtered by category1: ${query.category1}`
    );
    conditions.push(inArray(knowledgeEntry.category1, query.category1));
  }
  if (query.category2?.length) {
    await log.debug(
      `Getting knowledge filtered by category2: ${query.category2}`
    );
    conditions.push(inArray(knowledgeEntry.category2, query.category2));
  }
  if (query.category3?.length) {
    await log.debug(
      `Getting knowledge filtered by category3: ${query.category3}`
    );
    conditions.push(inArray(knowledgeEntry.category3, query.category3));
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
 * Get all knowledge in a simpler format
 * A helper wrapper over the getKnowledge function.
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
