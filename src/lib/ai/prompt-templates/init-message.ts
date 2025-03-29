import { getFullPromptTemplate } from "./crud";

/**
 * Helper to split a template name into category and name
 */
export const splitTemplateName = (templateName: string) => {
  const [category, name] = templateName.split(":");
  return { category, name };
};

/**
 * Helper to check if a string is a UUID
 */
export const isUUID = (str: string) => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    str
  );
};

/**
 * Will return the initial system and user prompt from a users input and template
 *
 * templateName: "<category>:<name>"
 * userInput: {
 *  user_input: "",
 *  some_more_text_variable: "",
 *  }
 * }
 */
export const initTemplateMessage = async (request: {
  organisationId: string;
  template: string; // "<category>:<name>" or "00000000-0000-0000-0000-000000000000"
  userInput: Record<string, string>;
}): Promise<{
  systemPrompt: string;
  userPrompt: string;
  knowledgeEntries: { id: string }[];
  knowledgeFilters: { id: string }[];
  knowledgeGroups: { id: string }[];
}> => {
  // sequence of checks:
  // 1. check if "template" is a UUID
  // 2. check if "template" is a valid template name
  // 3. if not, throw an error

  // check if "template" is a UUID
  let promptId: string | undefined;
  let promptCategory: string | undefined;
  let promptName: string | undefined;
  if (isUUID(request.template)) {
    promptId = request.template;
  } else {
    const { category, name } = splitTemplateName(request.template);
    promptCategory = category;
    promptName = name;
  }

  let {
    systemPrompt,
    userPrompt,
    placeholders,
    knowledgeEntries,
    knowledgeFilters,
    knowledgeGroups,
  } = await getFullPromptTemplate({
    promptCategory,
    promptName,
    promptId,
    organisationId: request.organisationId,
  });

  // iterate over placeholders and replace them in the template
  for (const placeholder of placeholders) {
    const placeholderValue =
      request.userInput[placeholder.name] !== undefined
        ? request.userInput[placeholder.name]
        : placeholder.defaultValue || "";

    systemPrompt = systemPrompt.replace(
      `{{${placeholder.name}}}`,
      placeholderValue
    );

    if (userPrompt) {
      userPrompt = userPrompt.replace(
        `{{${placeholder.name}}}`,
        placeholderValue
      );
    }
  }

  return {
    systemPrompt,
    userPrompt: userPrompt || request.userInput["user_input"] || "",
    knowledgeEntries: knowledgeEntries.map((knowledgeEntry) => ({
      id: knowledgeEntry.id,
    })),
    knowledgeFilters: knowledgeFilters.map((knowledgeFilter) => ({
      id: knowledgeFilter.id,
    })),
    knowledgeGroups: knowledgeGroups.map((knowledgeGroup) => ({
      id: knowledgeGroup.id,
    })),
  };
};
