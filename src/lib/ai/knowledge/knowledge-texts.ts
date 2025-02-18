import { and, asc, eq, or, isNull } from "drizzle-orm";
import { getDb } from "../../db/db-connection";
import {
  knowledgeText,
  type KnowledgeTextInsert,
} from "../../db/schema/knowledge";
import { RESPONSES } from "../../responses";

/**
 * Create a new knowledgeText entry
 */
export const createKnowledgeText = async (data: KnowledgeTextInsert) => {
  const e = await getDb().insert(knowledgeText).values(data).returning();
  return e[0];
};

/**
 * Read all knowledgeText entries or a specific entry by ID
 */
export const readKnowledgeText = async (filters: {
  id?: string;
  organisationId: string;
  teamId?: string;
  userId?: string;
  workspaceId?: string;
  limit?: number;
  page?: number;
}) => {
  const permissionConditions = [];
  if (!filters.workspaceId) {
    permissionConditions.push(
      and(
        isNull(knowledgeText.userId),
        isNull(knowledgeText.teamId),
        isNull(knowledgeText.workspaceId)
      )
    );
  }

  if (filters.userId) {
    permissionConditions.push(eq(knowledgeText.userId, filters.userId));
  }

  if (filters.teamId) {
    permissionConditions.push(eq(knowledgeText.teamId, filters.teamId));
  }

  if (filters.workspaceId) {
    permissionConditions.push(
      eq(knowledgeText.workspaceId, filters.workspaceId)
    );
  }

  const query = getDb()
    .select()
    .from(knowledgeText)
    .orderBy(asc(knowledgeText.createdAt))
    .where(
      and(
        eq(knowledgeText.organisationId, filters.organisationId),
        or(...permissionConditions)
      )
    )
    .$dynamic();

  if (filters.id) {
    query.where(eq(knowledgeText.id, filters.id));
  }

  if (filters.limit) {
    query.limit(filters.limit);
  }
  if (filters.page && filters.limit) {
    query.offset((filters.page - 1) * filters.limit);
  }
  return await query;
};

/**
 * Get a knowledgeText entry by name, category and organisationId
 */
export const getKnowledgeTextByTitle = async (filters: {
  title: string;
  organisationId: string;
}) => {
  const result = await getDb()
    .select()
    .from(knowledgeText)
    .where(
      and(
        eq(knowledgeText.title, filters.title),
        eq(knowledgeText.organisationId, filters.organisationId)
      )
    );
  if (result.length === 0) {
    throw new Error("Knowledge text not found");
  }
  return result[0];
};

/**
 * Update a knowledgeText entry by ID
 */
export const updateKnowledgeText = async (
  id: string,
  data: Partial<KnowledgeTextInsert>,
  context: {
    organisationId: string;
    userId?: string;
    teamId?: string;
    workspaceId?: string;
  }
) => {
  // First check if user has permission to update this entry
  const existing = await getDb()
    .select()
    .from(knowledgeText)
    .where(
      and(
        eq(knowledgeText.id, id),
        eq(knowledgeText.organisationId, context.organisationId),
        or(
          // Public entries
          and(
            isNull(knowledgeText.userId),
            isNull(knowledgeText.teamId),
            isNull(knowledgeText.workspaceId)
          ),
          // User specific entries
          context.userId ? eq(knowledgeText.userId, context.userId) : undefined,
          // Team specific entries
          context.teamId ? eq(knowledgeText.teamId, context.teamId) : undefined,
          // Workspace specific entries
          context.workspaceId
            ? eq(knowledgeText.workspaceId, context.workspaceId)
            : undefined
        )
      )
    );

  if (!existing.length) {
    throw new Error("Knowledge text not found or access denied");
  }

  const e = await getDb()
    .update(knowledgeText)
    .set({ ...data })
    .where(eq(knowledgeText.id, id))
    .returning();

  return e[0];
};

/**
 * Delete a knowledgeText entry by ID
 */
export const deleteKnowledgeText = async (
  id: string,
  context: {
    organisationId: string;
    userId?: string;
    teamId?: string;
    workspaceId?: string;
  }
) => {
  const e = await getDb()
    .delete(knowledgeText)
    .where(
      and(
        eq(knowledgeText.id, id),
        eq(knowledgeText.organisationId, context.organisationId),
        or(
          // Public entries
          and(
            isNull(knowledgeText.userId),
            isNull(knowledgeText.teamId),
            isNull(knowledgeText.workspaceId)
          ),
          // User specific entries
          context.userId ? eq(knowledgeText.userId, context.userId) : undefined,
          // Team specific entries
          context.teamId ? eq(knowledgeText.teamId, context.teamId) : undefined,
          // Workspace specific entries
          context.workspaceId
            ? eq(knowledgeText.workspaceId, context.workspaceId)
            : undefined
        )
      )
    )
    .returning();

  if (!e.length) {
    throw new Error("Knowledge text not found or access denied");
  }

  return RESPONSES.SUCCESS;
};
