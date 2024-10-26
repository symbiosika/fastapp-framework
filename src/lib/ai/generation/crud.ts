import { and, eq, Placeholder } from "drizzle-orm";
import { getDb } from "../../../lib/db/db-connection";
import {
  promptTemplatePlaceholders,
  promptTemplates,
  type PromptTemplatePlaceholdersInsert,
  type PromptTemplatePlaceholdersSelect,
  type PromptTemplatesInsert,
  type PromptTemplatesSelect,
} from "../../../lib/db/db-schema";
import { getPromptTemplateDefinition } from ".";

/**
 * Get all placeholders for one template as an object
 */
export const getPlaceholdersForPromptTemplate = async (request: {
  promptId?: string;
  promptName?: string;
  promptCategory?: string;
}) => {
  const definition = await getPromptTemplateDefinition(request);
  const prefilledArray = definition.promptTemplatePlaceholders.map((p) => ({
    [p.name]: p.defaultValue,
  }));
  const prefilledObject = prefilledArray.reduce(
    (acc, curr) => ({ ...acc, ...curr }),
    {}
  );
  return {
    placeholders: prefilledObject,
    placeholderDefinitions: definition.promptTemplatePlaceholders,
  };
};

/**
 * Get a list of all templates
 */
export const getTemplates = async () => {
  return await getDb().select().from(promptTemplates);
};

/**
 * Get a plain template as DB entry
 */
export const getPlainTemplate = async (request: {
  promptId?: string;
  promptName?: string;
  promptCategory?: string;
}) => {
  if (request.promptId) {
    return await getDb()
      .select()
      .from(promptTemplates)
      .where(
        and(
          eq(promptTemplates.id, request.promptId),
          eq(promptTemplates.hidden, false)
        )
      );
  } else if (request.promptName && request.promptCategory) {
    return await getDb()
      .select()
      .from(promptTemplates)
      .where(
        and(
          eq(promptTemplates.name, request.promptName),
          eq(promptTemplates.category, request.promptCategory),
          eq(promptTemplates.hidden, false)
        )
      );
  }
  throw new Error(
    "Either promptId or promptName and promptCategory have to be set."
  );
};

/**
 * Get all plain placeholders for a prompt template id
 */
export const getPlainPlaceholdersForPromptTemplate = async (
  promptId: string
) => {
  const placeholders = await getDb()
    .select()
    .from(promptTemplatePlaceholders)
    .where(
      and(
        eq(promptTemplatePlaceholders.promptTemplateId, promptId),
        eq(promptTemplatePlaceholders.hidden, false)
      )
    );
  return placeholders;
};

/**
 * Update a prompt template by ID
 */
export const updatePromptTemplate = async (data: PromptTemplatesSelect) => {
  if (!data.id || data.id === "") {
    throw new Error("A valid prompt template ID is required.");
  }
  const updated = await getDb()
    .update(promptTemplates)
    .set(data)
    .where(eq(promptTemplates.id, data.id))
    .returning();
  return updated[0];
};

/**
 * Add a new prompt template
 */
export const addPromptTemplate = async (data: PromptTemplatesInsert) => {
  const added = await getDb().insert(promptTemplates).values(data).returning();
  return added[0];
};

/**
 * Delete a prompt template by ID
 */
export const deletePromptTemplate = async (id: string) => {
  await getDb().delete(promptTemplates).where(eq(promptTemplates.id, id));
  return { success: true };
};

/**
 * Add a new placeholder to a prompt template
 */
export const addPromptTemplatePlaceholder = async (
  data: PromptTemplatePlaceholdersInsert
) => {
  const added = await getDb()
    .insert(promptTemplatePlaceholders)
    .values(data)
    .returning();
  return added[0];
};

/**
 * Update a placeholder entry by ID
 */
export const updatePromptTemplatePlaceholder = async (
  data: PromptTemplatePlaceholdersSelect
) => {
  if (!data.id || data.id === "") {
    throw new Error("A valid placeholder ID is required.");
  }
  const updated = await getDb()
    .update(promptTemplatePlaceholders)
    .set(data)
    .where(
      and(
        eq(promptTemplatePlaceholders.id, data.id),
        eq(promptTemplatePlaceholders.promptTemplateId, data.promptTemplateId)
      )
    )
    .returning();
  return updated[0];
};

/**
 * Delete a placeholder for a prompt template by ID
 */
export const deletePromptTemplatePlaceholder = async (
  id: string,
  promptTemplateId: string
) => {
  await getDb()
    .delete(promptTemplatePlaceholders)
    .where(
      and(
        eq(promptTemplatePlaceholders.id, id),
        eq(promptTemplatePlaceholders.promptTemplateId, promptTemplateId)
      )
    );

  return { success: true };
};
