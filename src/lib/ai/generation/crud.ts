import { and, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/db-connection";
import {
  promptTemplatePlaceholders,
  promptTemplates,
  type PromptTemplatePlaceholdersInsert,
  type PromptTemplatePlaceholdersSelect,
  type PromptTemplatesInsert,
  promptTemplatePlaceholderExamples,
} from "../../../lib/db/db-schema";
import { getPromptTemplateDefinition } from ".";
import { RESPONSES } from "../../responses";

/**
 * Get all placeholders for one template as an object
 */
export const getPlaceholdersForPromptTemplate = async (request: {
  promptId?: string;
  promptName?: string;
  promptCategory?: string;
  organisationId?: string;
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
export const getTemplates = async (organisationId: string) => {
  return await getDb()
    .select()
    .from(promptTemplates)
    .where(eq(promptTemplates.organisationId, organisationId));
};

/**
 * Get a plain template as DB entry
 */
export const getPlainTemplate = async (request: {
  promptId?: string;
  promptName?: string;
  promptCategory?: string;
  organisationId?: string;
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
  } else if (
    request.promptName &&
    request.promptCategory &&
    request.organisationId
  ) {
    return await getDb()
      .select()
      .from(promptTemplates)
      .where(
        and(
          eq(promptTemplates.name, request.promptName),
          eq(promptTemplates.category, request.promptCategory),
          eq(promptTemplates.organisationId, request.organisationId),
          eq(promptTemplates.hidden, false)
        )
      );
  }
  throw new Error(
    "Either promptId or [promptName, promptCategory and organisationId] have to be set."
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

  const result: PromptTemplatePlaceholdersSelect[] = await Promise.all(
    placeholders.map(async (placeholder) => ({
      ...placeholder,
      suggestions: (
        await getDb()
          .select()
          .from(promptTemplatePlaceholderExamples)
          .where(
            eq(promptTemplatePlaceholderExamples.placeholderId, placeholder.id)
          )
          .orderBy(promptTemplatePlaceholderExamples.value)
      ).map((e) => e.value),
    }))
  );

  return result;
};

/**
 * Update a prompt template by ID
 */
export const updatePromptTemplate = async (data: PromptTemplatesInsert) => {
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
export const deletePromptTemplate = async (
  id: string,
  organisationId: string
) => {
  await getDb()
    .delete(promptTemplates)
    .where(
      and(
        eq(promptTemplates.id, id),
        eq(promptTemplates.organisationId, organisationId)
      )
    );
  return RESPONSES.SUCCESS;
};

/**
 * Add a new placeholder to a prompt template
 */
export const addPromptTemplatePlaceholder = async (
  data: PromptTemplatePlaceholdersInsert & { suggestions?: string[] }
) => {
  const { suggestions, ...placeholderData } = data;
  const added = await getDb().transaction(async (tx) => {
    const placeholder = await tx
      .insert(promptTemplatePlaceholders)
      .values(placeholderData)
      .returning();

    if (suggestions && suggestions.length > 0) {
      await tx.insert(promptTemplatePlaceholderExamples).values(
        suggestions.map((value) => ({
          placeholderId: placeholder[0].id,
          value,
        }))
      );
    }

    return placeholder[0];
  });
  return added;
};

/**
 * Update a placeholder entry by ID
 */
export const updatePromptTemplatePlaceholder = async (
  data: PromptTemplatePlaceholdersSelect & { suggestions?: string[] }
) => {
  if (!data.id || data.id === "") {
    throw new Error("A valid placeholder ID is required.");
  }
  const { suggestions, ...placeholderData } = data;

  const updated = await getDb().transaction(async (tx) => {
    const placeholder = await tx
      .update(promptTemplatePlaceholders)
      .set(placeholderData)
      .where(
        and(
          eq(promptTemplatePlaceholders.id, data.id),
          eq(promptTemplatePlaceholders.promptTemplateId, data.promptTemplateId)
        )
      )
      .returning();

    // Delete existing suggestions
    await tx
      .delete(promptTemplatePlaceholderExamples)
      .where(eq(promptTemplatePlaceholderExamples.placeholderId, data.id));

    if (suggestions != null) {
      // Add new suggestions if any
      if (suggestions.length > 0) {
        await tx.insert(promptTemplatePlaceholderExamples).values(
          suggestions.map((value) => ({
            placeholderId: data.id,
            value,
          }))
        );
      }
    }

    return placeholder[0];
  });

  return updated;
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

  return RESPONSES.SUCCESS;
};
