import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../db/db-connection";
import { knowledgeText } from "../../db/schema/knowledge";
import log from "../../log";

/**
 * Create a new knowledgeText entry
 */
export const createKnowledgeText = async (data: {
  text: string;
  title?: string;
  meta?: Record<string, string | number | boolean | undefined>;
  organisationId: string;
}) => {
  const e = await getDb()
    .insert(knowledgeText)
    .values({ ...data })
    .returning();
  return e[0];
};

/**
 * Read all knowledgeText entries or a specific entry by ID
 */
export const readKnowledgeText = async (data: {
  id?: string;
  organisationId: string;
  limit?: number;
  page?: number;
}) => {
  const query = getDb()
    .select()
    .from(knowledgeText)
    .orderBy(asc(knowledgeText.createdAt));
  query.where(eq(knowledgeText.organisationId, data.organisationId));

  if (data.id) {
    query.where(eq(knowledgeText.id, data.id));
  }
  if (data.limit) {
    query.limit(data.limit);
  }
  if (data.page && data.limit) {
    query.offset((data.page - 1) * data.limit);
  }
  return await query;
};

/**
 * Update a knowledgeText entry by ID
 */
export const updateKnowledgeText = async (
  id: string,
  data: {
    text?: string;
    title?: string;
    meta?: Record<string, string | number | boolean | undefined>;
  }
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
