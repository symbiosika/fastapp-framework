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
  knowledgeEntries: { id: string; label: string }[];
  knowledgeFilters: { id: string; label: string }[];
  knowledgeGroups: { id: string; label: string }[];
  tools: { enabled?: string[] } | undefined;
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
  } else if (request.template.startsWith("static-")) {
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
    tools,
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
      id: knowledgeEntry.knowledgeEntryId,
      label: knowledgeEntry.knowledgeEntry.name,
    })),
    knowledgeFilters: knowledgeFilters.map((knowledgeFilter) => ({
      id: knowledgeFilter.knowledgeFilterId,
      label: "Filter: " + knowledgeFilter.knowledgeFilter.name,
    })),
    knowledgeGroups: knowledgeGroups.map((knowledgeGroup) => ({
      id: knowledgeGroup.knowledgeGroupId,
      label: "Group: " + knowledgeGroup.knowledgeGroup.name,
    })),
    tools,
  };
};
