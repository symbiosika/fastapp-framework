import { and, eq, exists, or, type SQLWrapper } from "drizzle-orm";
import { getDb } from "../../db/db-connection";
import { knowledgeChunks, knowledgeEntry } from "../../db/schema/knowledge";
import { teamMembers } from "../../db/schema/users";

/**
 * Get a knowledge chunk by ID with user context validation
 */
export const getKnowledgeChunkById = async (
  id: string,
  organisationId: string,
  userId?: string
) => {
  const filters: SQLWrapper[] = [
    eq(knowledgeChunks.id, id),
    exists(
      getDb()
        .select()
        .from(knowledgeEntry)
        .where(
          and(
            eq(knowledgeEntry.id, knowledgeChunks.knowledgeEntryId),
            eq(knowledgeEntry.organisationId, organisationId)
          )
        )
    ),
  ];

  if (userId) {
    filters.push(
      or(
        exists(
          getDb()
            .select()
            .from(knowledgeEntry)
            .where(
              and(
                eq(knowledgeEntry.id, knowledgeChunks.knowledgeEntryId),
                eq(knowledgeEntry.userId, userId)
              )
            )
        ),
        exists(
          getDb()
            .select()
            .from(knowledgeEntry)
            .where(
              and(
                eq(knowledgeEntry.id, knowledgeChunks.knowledgeEntryId),
                exists(
                  getDb()
                    .select()
                    .from(teamMembers)
                    .where(
                      and(
                        eq(teamMembers.userId, userId),
                        eq(teamMembers.teamId, knowledgeEntry.teamId)
                      )
                    )
                )
              )
            )
        )
      )!
    );
  }

  const result = await getDb()
    .select({
      id: knowledgeChunks.id,
      text: knowledgeChunks.text,
      createdAt: knowledgeChunks.createdAt,
      knowledgeEntryId: knowledgeEntry.id,
      knowledgeEntryName: knowledgeEntry.name,
    })
    .from(knowledgeChunks)
    .leftJoin(
      knowledgeEntry,
      eq(knowledgeChunks.knowledgeEntryId, knowledgeEntry.id)
    )
    .where(and(...filters));

  if (!result[0]) {
    throw new Error("Knowledge chunk not found");
  }

  return result[0];
};
