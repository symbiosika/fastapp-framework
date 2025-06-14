import { and, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/db-connection";
import {
  promptTemplatePlaceholders,
  promptTemplates,
  promptTemplatePlaceholderExamples,
  type PromptTemplatePlaceholdersUpdate,
  type PromptTemplatePlaceholdersInsert,
  type PromptTemplatePlaceholdersSelect,
  type PromptTemplatesInsert,
  type PromptTemplatesSelect,
  promptTemplateKnowledgeEntries,
  promptTemplateKnowledgeFilters,
  promptTemplateKnowledgeGroups,
} from "../../../lib/db/db-schema";
import { RESPONSES } from "../../responses";
import { getPromptTemplateDefinition } from "./get-prompt-template";
import {
  getServerSideStaticTemplateById,
  getServerSideStaticTemplateByName,
  getServerSideStaticTemplates,
} from "./static-templates";

export type FullPromptTemplateImport = PromptTemplatesInsert & {
  placeholders?: Array<
    Omit<PromptTemplatePlaceholdersInsert, "promptTemplateId"> & {
      suggestions?: string[];
    }
  >;
  knowledgeEntryIds?: string[];
  knowledgeFilterIds?: string[];
  knowledgeGroupIds?: string[];
};

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
 * Get a list of all templates (including static templates)
 */
export const getTemplates = async (organisationId: string) => {
  // Get database templates
  const dbTemplates = await getDb()
    .select()
    .from(promptTemplates)
    .where(eq(promptTemplates.organisationId, organisationId));

  // Get static templates
  const staticTemplates = getServerSideStaticTemplates(organisationId);

  // Combine and return both
  return [...dbTemplates, ...staticTemplates];
};

/**
 * Get a plain template as DB entry (including static templates)
 */
export const getPlainTemplate = async (request: {
  promptId?: string;
  promptName?: string;
  promptCategory?: string;
  organisationId?: string;
}) => {
  // First check if it's a request for a static template by name and category
  if (
    request.promptName &&
    request.promptCategory &&
    request.promptCategory === "system"
  ) {
    try {
      const staticTemplate = getServerSideStaticTemplateByName(
        request.promptName
      );
      return {
        ...staticTemplate,
        organisationId: request.organisationId || "",
      };
    } catch (error) {
      // If static template not found, continue to database search
    }
  }

  if (request.promptId) {
    const template = await getDb()
      .select()
      .from(promptTemplates)
      .where(
        and(
          eq(promptTemplates.id, request.promptId),
          eq(promptTemplates.hidden, false)
        )
      );
    if (template.length === 0) {
      throw new Error("Template not found.");
    }
    return template[0];
  } else if (
    request.promptName &&
    request.promptCategory &&
    request.organisationId
  ) {
    const template = await getDb()
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
    if (template.length === 0) {
      throw new Error("Template not found.");
    }
    return template[0];
  }
  throw new Error(
    "Either promptId or [promptName and promptCategory] and organisationId have to be set."
  );
};

/**
 * Get all plain placeholders for a prompt template id (including static templates)
 */
export const getPlainPlaceholdersForPromptTemplate = async (
  promptId: string
) => {
  // Check if this is a static template ID
  if (promptId.startsWith("static-")) {
    // For static templates, we need to find the template by its ID and return its placeholders
    const staticTemplates = getServerSideStaticTemplates("");
    const staticTemplate = staticTemplates.find((t) => t.id === promptId);
    if (staticTemplate) {
      return staticTemplate.placeholders;
    }
    throw new Error("Static template not found.");
  }

  const placeholders = await getDb()
    .select()
    .from(promptTemplatePlaceholders)
    .where(
      and(
        eq(promptTemplatePlaceholders.promptTemplateId, promptId),
        eq(promptTemplatePlaceholders.hidden, false)
      )
    );

  const result = await Promise.all(
    placeholders.map(async (placeholder) => {
      const suggestions = await getDb()
        .select()
        .from(promptTemplatePlaceholderExamples)
        .where(
          eq(promptTemplatePlaceholderExamples.placeholderId, placeholder.id)
        );

      return {
        ...placeholder,
        suggestions: suggestions.map((s) => s.value),
      };
    })
  );

  return result;
};

/**
 * Get a placeholder for a prompt template by ID (including static templates)
 */
export const getPromptTemplatePlaceholderById = async (id: string) => {
  // Check if this is a static placeholder ID
  if (id.startsWith("static-") || id.startsWith("placeholder-")) {
    // For static placeholders, search through all static templates
    const staticTemplates = getServerSideStaticTemplates("");
    for (const template of staticTemplates) {
      const placeholder = template.placeholders.find((p) => p.id === id);
      if (placeholder) {
        return placeholder;
      }
    }
    throw new Error("Static placeholder not found.");
  }

  const placeholder = await getDb()
    .select()
    .from(promptTemplatePlaceholders)
    .where(eq(promptTemplatePlaceholders.id, id));

  if (placeholder.length === 0) {
    throw new Error("Placeholder not found.");
  }

  // Get suggestions for this placeholder
  const suggestions = await getDb()
    .select()
    .from(promptTemplatePlaceholderExamples)
    .where(eq(promptTemplatePlaceholderExamples.placeholderId, id));

  return {
    ...placeholder[0],
    suggestions: suggestions.map((s) => s.value),
  };
};

/**
 * Update a prompt template by ID
 */
export const updatePromptTemplate = async (
  data: Partial<PromptTemplatesSelect>
) => {
  if (!data.id || data.id === "") {
    throw new Error("A valid prompt template ID is required.");
  }

  // Prevent updating static templates
  if (data.id.startsWith("static-")) {
    throw new Error("Static templates cannot be updated.");
  }

  const updated = await getDb()
    .update(promptTemplates)
    .set(data)
    .where(eq(promptTemplates.id, data.id))
    .returning();

  if (updated.length === 0) {
    throw new Error("Prompt template not found.");
  }

  return updated[0];
};

/**
 * Add a new prompt template
 */
export const addPromptTemplate = async (data: PromptTemplatesInsert) => {
  // check the length of the name and category
  if (
    data.name.length < 1 ||
    data.name.length > 255 ||
    (data.category && data.category.length < 1 && data.category.length > 255)
  ) {
    throw new Error("Name and category must be between 1 and 255 characters.");
  }
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
  // Prevent deleting static templates
  if (id.startsWith("static-")) {
    throw new Error("Static templates cannot be deleted.");
  }

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
  // Prevent adding placeholders to static templates
  if (data.promptTemplateId.startsWith("static-")) {
    throw new Error("Placeholders cannot be added to static templates.");
  }

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

    return {
      ...placeholder[0],
      suggestions: suggestions || [],
    };
  });
  return added;
};

/**
 * Update a placeholder entry by ID
 */
export const updatePromptTemplatePlaceholder = async (
  data: PromptTemplatePlaceholdersUpdate & { suggestions?: string[] }
) => {
  if (data.id == null || data.id === "" || data.promptTemplateId == null) {
    throw new Error(
      "A valid placeholder ID and prompt template ID are required."
    );
  }

  // Prevent updating static template placeholders
  if (
    data.id!.startsWith("static-") ||
    data.id!.startsWith("placeholder-") ||
    data.promptTemplateId!.startsWith("static-")
  ) {
    throw new Error("Static template placeholders cannot be updated.");
  }

  const { suggestions, ...placeholderData } = data;

  const updated = await getDb().transaction(async (tx) => {
    const placeholder = await tx
      .update(promptTemplatePlaceholders)
      .set(placeholderData)
      .where(
        and(
          eq(promptTemplatePlaceholders.id, data.id!),
          eq(
            promptTemplatePlaceholders.promptTemplateId,
            data.promptTemplateId!
          )
        )
      )
      .returning();

    if (placeholder.length === 0) {
      throw new Error("Placeholder not found.");
    }

    // Delete existing suggestions
    await tx
      .delete(promptTemplatePlaceholderExamples)
      .where(eq(promptTemplatePlaceholderExamples.placeholderId, data.id!));

    let updatedSuggestions: string[] = [];
    if (suggestions != null) {
      // Add new suggestions if any
      if (suggestions.length > 0) {
        await tx.insert(promptTemplatePlaceholderExamples).values(
          suggestions.map((value) => ({
            placeholderId: data.id!,
            value,
          }))
        );
        updatedSuggestions = suggestions;
      }
    }

    return {
      ...placeholder[0],
      suggestions: updatedSuggestions,
    };
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
  // Prevent deleting static template placeholders
  if (
    id.startsWith("static-") ||
    id.startsWith("placeholder-") ||
    promptTemplateId.startsWith("static-")
  ) {
    throw new Error("Static template placeholders cannot be deleted.");
  }

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

/**
 * Get a complete prompt template with all related data
 */
export const getFullPromptTemplate = async (request: {
  promptId?: string;
  promptName?: string;
  promptCategory?: string;
  organisationId?: string;
}) => {
  if (
    request.promptCategory &&
    request.promptName &&
    request.promptCategory === "system"
  ) {
    const template = getServerSideStaticTemplateByName(
      request.promptId ?? request.promptName ?? ""
    );
    return {
      ...template,
      knowledgeEntries: [],
      knowledgeFilters: [],
      knowledgeGroups: [],
    };
  } else if (request.promptId?.startsWith("static-")) {
    const template = getServerSideStaticTemplateById(request.promptId);
    return {
      ...template,
      knowledgeEntries: [],
      knowledgeFilters: [],
      knowledgeGroups: [],
    };
  }

  const where = request.promptId
    ? eq(promptTemplates.id, request.promptId)
    : request.promptName && request.promptCategory && request.organisationId
      ? and(
          eq(promptTemplates.name, request.promptName),
          eq(promptTemplates.category, request.promptCategory),
          eq(promptTemplates.organisationId, request.organisationId)
        )
      : undefined;

  if (!where) {
    throw new Error("Invalid request parameters");
  }

  const template = await getDb().query.promptTemplates.findFirst({
    where,
    with: {
      placeholders: {
        with: {
          suggestions: true,
        },
      },
      knowledgeEntries: {
        with: {
          knowledgeEntry: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
      knowledgeFilters: {
        with: {
          knowledgeFilter: true,
        },
      },
      knowledgeGroups: {
        with: {
          knowledgeGroup: true,
        },
      },
    },
  });

  if (!template) {
    throw new Error("Prompt template not found");
  }

  return template;
};

/**
 * Get all complete prompt templates for an organisation
 */
export const getFullPromptTemplates = async (organisationId: string) => {
  // Get all templates with their relations in one query
  const templates = await getDb().query.promptTemplates.findMany({
    where: eq(promptTemplates.organisationId, organisationId),
    with: {
      placeholders: {
        with: {
          suggestions: true,
        },
      },
      knowledgeEntries: {
        with: {
          knowledgeEntry: true,
        },
      },
      knowledgeFilters: {
        with: {
          knowledgeFilter: true,
        },
      },
      knowledgeGroups: {
        with: {
          knowledgeGroup: true,
        },
      },
    },
  });
  return templates;
};

/**
 * Create a complete prompt template with all related data
 */
export const createFullPromptTemplate = async (
  data: FullPromptTemplateImport,
  overwriteExisting = false
) => {
  let id: string | null = null;
  await getDb().transaction(async (tx) => {
    // 0. check for existing and delete if overwrite is true
    if (overwriteExisting && data.id) {
      await tx.delete(promptTemplates).where(eq(promptTemplates.id, data.id));
    }

    // 1. Create the template
    const [template] = await tx
      .insert(promptTemplates)
      .values(data)
      .returning();

    // 2. Create placeholders with suggestions if provided
    if (data.placeholders) {
      for (const placeholder of data.placeholders) {
        const { suggestions, ...placeholderData } = placeholder;
        const [placeholderRecord] = await tx
          .insert(promptTemplatePlaceholders)
          .values({
            ...placeholderData,
            promptTemplateId: template.id,
          })
          .returning();

        if (suggestions && suggestions.length > 0) {
          await tx.insert(promptTemplatePlaceholderExamples).values(
            suggestions.map((value) => ({
              placeholderId: placeholderRecord.id,
              value,
            }))
          );
        }
      }
    }

    // 3. Create knowledge entry assignments if provided
    if (data.knowledgeEntryIds && data.knowledgeEntryIds.length > 0) {
      await tx.insert(promptTemplateKnowledgeEntries).values(
        data.knowledgeEntryIds.map((entryId) => ({
          promptTemplateId: template.id,
          knowledgeEntryId: entryId,
        }))
      );
    }

    // 4. Create knowledge filter assignments if provided
    if (data.knowledgeFilterIds && data.knowledgeFilterIds.length > 0) {
      await tx.insert(promptTemplateKnowledgeFilters).values(
        data.knowledgeFilterIds.map((filterId) => ({
          promptTemplateId: template.id,
          knowledgeFilterId: filterId,
        }))
      );
    }

    // 5. Create knowledge group assignments if provided
    if (data.knowledgeGroupIds && data.knowledgeGroupIds.length > 0) {
      await tx.insert(promptTemplateKnowledgeGroups).values(
        data.knowledgeGroupIds.map((groupId) => ({
          promptTemplateId: template.id,
          knowledgeGroupId: groupId,
        }))
      );
    }

    id = template.id;
  });
  // Return the complete template with all related data
  if (!id) {
    throw new Error("Something went wrong while creating the template.");
  }
  return await getFullPromptTemplate({ promptId: id });
};
