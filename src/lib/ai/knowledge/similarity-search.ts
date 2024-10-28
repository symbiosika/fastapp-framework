import { sql } from "drizzle-orm";
import { knowledgeChunks } from "../../../lib/db/db-schema";
import { generateEmbedding } from "../standard";
import { getDb } from "../../../lib/db/db-connection";
import log from "../../../lib/log";

type KnowledgeChunk = {
  id: string;
  text: string;
  knowledgeEntryId: string;
  order: number;
};

/**
 * Get the n nearest embeddings to the search text
 */
export async function getNearestEmbeddings(
  searchText: string,
  n: number = 5,
  addBeforeN: number = 0,
  addAfterN: number = 0,
  filterKnowledgeEntryIds?: string[]
): Promise<{ id: string; text: string }[]> {
  // Generate the embedding for the search text
  const embed = await generateEmbedding(searchText);
  const result = await getDb().execute<KnowledgeChunk>(sql`
	  SELECT
		${knowledgeChunks.id}, 
		${knowledgeChunks.text},
		${knowledgeChunks.knowledgeEntryId} AS "knowledgeEntryId",
		${knowledgeChunks.order}
	  FROM 
		${knowledgeChunks}

      -- filter by knowledgeEntryId or no filter!
		${sql.raw(`
        ${
          filterKnowledgeEntryIds
            ? `WHERE knowledgeEntryId IN (${filterKnowledgeEntryIds.map((id) => `'${id}'`).join(",")})`
            : ""
        }`)} 
	  ORDER BY
		${knowledgeChunks.textEmbedding} <-> ${sql.raw(`'[${embed.embedding}]'`)} ASC
	  LIMIT
		${n};
	`);
  log.debug(`Found ${result.rows.length} chunks by similarity search`);

  // return if no addBeforeN and addAfterN
  if (addBeforeN < 1 && addAfterN < 1) {
    return result.rows;
  }

  // Else. Also add before and after N
  // This will get the knowledgeEntryId and order.
  // Now it will try to add before and after N to the result by order.
  const usedKnowledgeEntryIds = new Set<string>();
  const resultRows: KnowledgeChunk[] = [];

  for (const e of result.rows) {
    if (usedKnowledgeEntryIds.has(e.knowledgeEntryId)) continue;
    usedKnowledgeEntryIds.add(e.knowledgeEntryId);
    log.debug(
      `Adding before and after chunks for entry: ${JSON.stringify({ ...e, text: "" })}`
    );

    // Get all entries with this knowledgeEntryId +- addBeforeN and addAfterN by SQL
    const entries = await getDb().execute<KnowledgeChunk>(sql`
        SELECT
            ${knowledgeChunks.id}, 
            ${knowledgeChunks.text},
            ${knowledgeChunks.knowledgeEntryId} AS "knowledgeEntryId",
            ${knowledgeChunks.order}
        FROM 
		${knowledgeChunks}
            WHERE ${knowledgeChunks.knowledgeEntryId} = ${e.knowledgeEntryId}
            AND ${knowledgeChunks.order} >= ${e.order - addBeforeN}
            AND ${knowledgeChunks.order} <= ${e.order + addAfterN}
        `);
    log.debug(
      `Found ${entries.rows.length} additional chunks for knowledgeEntryId: ${e.knowledgeEntryId}`
    );
    resultRows.push(...entries.rows);
  }
  return resultRows;
}
