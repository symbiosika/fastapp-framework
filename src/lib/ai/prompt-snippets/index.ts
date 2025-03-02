import {
  and,
  eq,
  exists,
  inArray,
  isNull,
  or,
  type SQLWrapper,
} from "drizzle-orm";
import { getDb } from "../../db/db-connection";
import { promptSnippets } from "../../db/schema/prompts";
import { teamMembers } from "../../db/schema/users";
import { checkTeamMemberRole } from "../../usermanagement/teams";
import { checkOrganisationMemberRole } from "../../usermanagement/oganisations";

/**
 * Get all prompt snippets
 * Optionally filtered by name and category
 */
export const getPromptSnippets = async (query: {
  userId: string;
  organisationId: string;
  names?: string[];
  categories?: string[];
  teamId?: string | null;
}) => {
  const filters: SQLWrapper[] = [
    or(
      and(
        eq(promptSnippets.userId, query.userId),
        eq(promptSnippets.organisationId, query.organisationId)
      ),
      and(
        eq(promptSnippets.organisationWide, true),
        eq(promptSnippets.organisationId, query.organisationId)
      ),
      exists(
        getDb()
          .select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.userId, query.userId),
              eq(teamMembers.teamId, promptSnippets.teamId)
            )
          )
      )
    )!,
  ];

  // set names filter
  if (query.names && query.names.length > 0) {
    filters.push(inArray(promptSnippets.name, query.names));
  }

  // set categories filter
  if (query.categories && query.categories.length > 0) {
    filters.push(inArray(promptSnippets.category, query.categories));
  }

  // set teamId filter
  if (query.teamId) {
    // check permissions
    await checkTeamMemberRole(query.teamId, query.userId, ["admin", "member"]);
    filters.push(eq(promptSnippets.teamId, query.teamId));
  }

  return await getDb()
    .select()
    .from(promptSnippets)
    .where(and(...filters));
};

/**
 * Get one prompt snippet by id
 */
export const getPromptSnippetById = async (
  id: string,
  organisationId: string,
  userId?: string
) => {
  const filters: SQLWrapper[] = [
    eq(promptSnippets.id, id),
    eq(promptSnippets.organisationId, organisationId),
  ];

  if (userId) {
    filters.push(
      or(
        eq(promptSnippets.userId, userId),
        eq(promptSnippets.organisationWide, true),
        exists(
          getDb()
            .select()
            .from(teamMembers)
            .where(
              and(
                eq(teamMembers.userId, userId),
                eq(teamMembers.teamId, promptSnippets.teamId)
              )
            )
        )
      )!
    );
  }
  const result = await getDb()
    .select()
    .from(promptSnippets)
    .where(and(...filters));

  if (!result[0]) {
    throw "Prompt snippet not found";
  }
  return result[0];
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
  // check permissions
  if (input.userId && input.teamId) {
    await checkTeamMemberRole(input.teamId, input.userId, ["admin"]);
  } else if (input.userId && input.organisationWide) {
    await checkOrganisationMemberRole(input.organisationId, input.userId, [
      "admin",
      "owner",
    ]);
  }

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
  },
  userId?: string
) => {
  // get current item
  const item = await getPromptSnippetById(id, organisationId, userId);

  // check permissions on current item
  if (userId && item.teamId) {
    await checkTeamMemberRole(item.teamId, userId, ["admin"]);
  } else if (userId && item.organisationWide) {
    await checkOrganisationMemberRole(organisationId, userId, [
      "admin",
      "owner",
    ]);
  }

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
  organisationId: string,
  userId?: string
): Promise<void> => {
  const item = await getPromptSnippetById(id, organisationId, userId);

  // check permissions if a user is provided
  if (userId && item.teamId) {
    await checkTeamMemberRole(item.teamId, userId, ["admin"]);
  } else if (userId && item.organisationWide) {
    await checkOrganisationMemberRole(organisationId, userId, [
      "admin",
      "owner",
    ]);
  }

  await getDb()
    .delete(promptSnippets)
    .where(and(eq(promptSnippets.id, id)));

  return;
};
