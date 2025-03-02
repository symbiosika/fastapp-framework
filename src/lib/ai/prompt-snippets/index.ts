import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../db/db-connection";
import { promptSnippets } from "../../db/schema/prompts";

/**
 * Get all prompt snippets
 * Optionally filtered by name and category
 */
export const getPromptSnippets = async (query: {
  organisationId: string;
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

  if (where) {
    where = and(where, eq(promptSnippets.organisationId, query.organisationId));
  } else {
    where = eq(promptSnippets.organisationId, query.organisationId);
  }

  return await getDb().query.promptSnippets.findMany({
    where,
  });
};

/**
 * Get one prompt snippet by id
 */
export const getPromptSnippetById = async (
  id: string,
  organisationId: string
) => {
  return await getDb().query.promptSnippets.findFirst({
    where: and(
      eq(promptSnippets.id, id),
      eq(promptSnippets.organisationId, organisationId)
    ),
  });
};

/**
 * Get a prompt snippet by name, category and organisationId
 */
export const getPromptSnippetByNameAndCategory = async (data: {
  name: string;
  category: string;
  organisationId: string;
}) => {
  return await getDb().query.promptSnippets.findFirst({
    where: and(
      eq(promptSnippets.name, data.name),
      eq(promptSnippets.category, data.category),
      eq(promptSnippets.organisationId, data.organisationId)
    ),
  });
};

/**
 * Add a new prompt snippet
 */
export const addPromptSnippet = async (input: {
  name: string;
  content: string;
  organisationId: string;
  category?: string;
  userId?: string;
  organisationWide?: boolean;
  teamId?: string | null;
}) => {
  const result = await getDb()
    .insert(promptSnippets)
    .values({
      name: input.name,
      content: input.content,
      category: input.category || "",
      userId: input.userId,
      organisationWide: input.organisationWide || false,
      teamId: input.teamId,
      organisationId: input.organisationId,
    })
    .returning();

  return result[0];
};

/**
 * Update a prompt snippet
 */
export const updatePromptSnippet = async (
  id: string,
  organisationId: string,
  input: {
    name?: string;
    content?: string;
    category?: string;
    organisationWide?: boolean;
    teamId?: string | null;
  }
) => {
  const result = await getDb()
    .update(promptSnippets)
    .set({
      name: input.name,
      content: input.content,
      category: input.category,
      organisationWide: input.organisationWide,
      teamId: input.teamId,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(promptSnippets.id, id),
        eq(promptSnippets.organisationId, organisationId)
      )
    )
    .returning();

  return result[0];
};

/**
 * Delete a prompt snippet
 */
export const deletePromptSnippet = async (
  id: string,
  organisationId: string
) => {
  return await getDb()
    .delete(promptSnippets)
    .where(
      and(
        eq(promptSnippets.id, id),
        eq(promptSnippets.organisationId, organisationId)
      )
    )
    .returning();
};
