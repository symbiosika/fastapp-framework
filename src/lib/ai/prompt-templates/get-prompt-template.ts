import { getDb } from "../../db/db-connection";
import { promptTemplates } from "../../db/db-schema";
import { eq, and } from "drizzle-orm";

/**
 * Hepler to get a prompt template from the database by id.
 */
const getPromptTemplateById = async (
  promptId: string,
  returnHiddenEntries = true
) => {
  let where;
  if (!returnHiddenEntries) {
    where = and(
      eq(promptTemplates.hidden, false),
      eq(promptTemplates.id, promptId)
    );
  } else {
    where = eq(promptTemplates.id, promptId);
  }
  const result = await getDb().query.promptTemplates.findFirst({
    where,
    with: {
      promptTemplatePlaceholders: true,
    },
  });
  if (!result) {
    throw new Error("Sorry. The prompt template was not found.");
  }
  return result;
};

/**
 * Helper to get a prompt template from the database by name and category.
 */
const getPromptTemplateByNameAndCategory = async (
  promptName: string,
  promptCategory: string,
  returnHiddenEntries = true
) => {
  let where;
  if (!returnHiddenEntries) {
    where = and(
      eq(promptTemplates.hidden, false),
      eq(promptTemplates.name, promptName),
      eq(promptTemplates.category, promptCategory)
    );
  } else {
    where = and(
      eq(promptTemplates.name, promptName),
      eq(promptTemplates.category, promptCategory)
    );
  }
  const result = await getDb().query.promptTemplates.findFirst({
    where,
    with: {
      promptTemplatePlaceholders: true,
    },
  });
  if (!result) {
    throw new Error("Sorry. The prompt template was not found.");
  }
  return result;
};

/**
 * Helper to get the definition of a prompt template
 */
export const getPromptTemplateDefinition = async (
  query: {
    promptId?: string;
    promptName?: string;
    promptCategory?: string;
  },
  returnHiddenEntries = true
) => {
  if (query.promptId) {
    return await getPromptTemplateById(query.promptId, returnHiddenEntries);
  } else if (query.promptName && query.promptCategory) {
    return await getPromptTemplateByNameAndCategory(
      query.promptName,
      query.promptCategory,
      returnHiddenEntries
    );
  }
  throw new Error(
    "Either promptId or promptName and promptCategory have to be set."
  );
};
