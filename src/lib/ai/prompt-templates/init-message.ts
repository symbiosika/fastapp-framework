import { getPlaceholdersForPromptTemplate, getPlainTemplate } from "./crud";

/**
 * Helper to split a template name into category and name
 */
export const splitTemplateName = (templateName: string) => {
  const [category, name] = templateName.split(":");
  return { category, name };
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
  templateName: string;
  userInput: Record<string, string>;
}): Promise<{ systemPrompt: string; userPrompt: string }> => {
  const { category, name } = splitTemplateName(request.templateName);

  let { systemPrompt, userPrompt } = await getPlainTemplate({
    promptCategory: category,
    promptName: name,
    organisationId: request.organisationId,
  });

  const { placeholderDefinitions } = await getPlaceholdersForPromptTemplate({
    promptCategory: category,
    promptName: name,
    organisationId: request.organisationId,
  });

  // iterate over placeholders and replace them in the template
  for (const placeholder of Object.values(placeholderDefinitions)) {
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
  };
};
