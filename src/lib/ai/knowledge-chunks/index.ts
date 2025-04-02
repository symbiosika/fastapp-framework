import {
  and,
  eq,
  exists,
  or,
  type SQLWrapper,
  isNull,
  inArray,
} from "drizzle-orm";
import { getDb } from "../../db/db-connection";
import { knowledgeChunks, knowledgeEntry } from "../../db/schema/knowledge";
import { getUserTeamIds, getUserWorkspaceIds } from "../knowledge/permissions";

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
    const userTeams = await getUserTeamIds(userId, organisationId);
    const usersWorkspaces = await getUserWorkspaceIds(
      userId,
      organisationId,
      userTeams
    );

    filters.push(
      exists(
        getDb()
          .select()
          .from(knowledgeEntry)
          .where(
            and(
              eq(knowledgeEntry.id, knowledgeChunks.knowledgeEntryId),
              or(
                eq(knowledgeEntry.userId, userId),
                or(
                  isNull(knowledgeEntry.teamId),
                  inArray(knowledgeEntry.teamId, userTeams)
                ),
                or(
                  isNull(knowledgeEntry.workspaceId),
                  inArray(knowledgeEntry.workspaceId, usersWorkspaces)
                )
              )
            )
          )
      )
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
