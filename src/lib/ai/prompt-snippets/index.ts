import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../db/db-connection";
import { promptSnippets } from "../../db/schema/prompts";

/**
 * Get all prompt snippets
 * Optionally filtered by name and category
 */
export const getPromptSnippets = async (query?: {
  names?: string[];
  categories?: string[];
}) => {
  let where;
  if (query?.names && query.names.length > 0) {
    where = inArray(promptSnippets.name, query.names);
  } else if (query?.categories && query.categories.length > 0) {
    where = inArray(promptSnippets.category, query.categories);
  } else if (
    query?.names &&
    query.names.length > 0 &&
    query?.categories &&
    query.categories.length > 0
  ) {
    where = and(
      inArray(promptSnippets.name, query.names),
      inArray(promptSnippets.category, query.categories)
    );
  }

  return await getDb().query.promptSnippets.findMany({
    where,
  });
};

/**
 * Get one prompt snippet by id
 */
export const getPromptSnippetById = async (id: string) => {
  return await getDb().query.promptSnippets.findFirst({
    where: eq(promptSnippets.id, id),
  });
};

/**
 * Add a new prompt snippet
 */
export const addPromptSnippet = async (input: {
  name: string;
  content: string;
  category?: string;
  userId?: string;
}) => {
  const result = await getDb()
    .insert(promptSnippets)
    .values({
      name: input.name,
      content: input.content,
      category: input.category || "",
      userId: input.userId,
    })
    .returning();

  return result[0];
};

/**
 * Update a prompt snippet
 */
export const updatePromptSnippet = async (
  id: string,
  input: {
    name?: string;
    content?: string;
    category?: string;
  }
) => {
  const result = await getDb()
    .update(promptSnippets)
    .set({
      name: input.name,
      content: input.content,
      category: input.category,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(promptSnippets.id, id))
    .returning();

  return result[0];
};

/**
 * Delete a prompt snippet
 */
export const deletePromptSnippet = async (id: string) => {
  return await getDb()
    .delete(promptSnippets)
    .where(eq(promptSnippets.id, id))
    .returning();
};
