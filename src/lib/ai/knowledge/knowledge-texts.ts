import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../db/db-connection";
import {
  knowledgeText,
  type KnowledgeTextInsert,
} from "../../db/schema/knowledge";

/**
 * Create a new knowledgeText entry
 */
export const createKnowledgeText = async (data: KnowledgeTextInsert) => {
  const e = await getDb()
    .insert(knowledgeText)
    .values({ ...data })
    .returning();
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
  limit?: number;
  page?: number;
}) => {
  const query = getDb()
    .select()
    .from(knowledgeText)
    .orderBy(asc(knowledgeText.createdAt))
    .where(eq(knowledgeText.organisationId, filters.organisationId))
    .$dynamic();

  if (filters.id) {
    query.where(eq(knowledgeText.id, filters.id));
  }
  if (filters.teamId) {
    query.where(eq(knowledgeText.teamId, filters.teamId));
  }
  if (filters.userId) {
    query.where(eq(knowledgeText.userId, filters.userId));
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
  data: Partial<KnowledgeTextInsert>
) => {
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
  organisationId: string
) => {
  const e = await getDb()
    .delete(knowledgeText)
    .where(
      and(
        eq(knowledgeText.id, id),
        eq(knowledgeText.organisationId, organisationId)
      )
    )
    .returning();
  return { success: true };
};
