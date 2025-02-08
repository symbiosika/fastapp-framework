import { getDb } from "../../../lib/db/db-connection";
import { LLMOptions, promptTemplates } from "../../../lib/db/db-schema";
import { eq, and } from "drizzle-orm";
import type { ChatMessageRole } from "./chat-store";
import type { ChatMessage } from "./chat-store";

export type AgentSystemPrompt = {
  id: string;
  name: string;
  category: string;
  label: string;
  template: string;
  llmOptions: LLMOptions;
  langCode: string | null;
  needsInitialCall: boolean;
  promptTemplatePlaceholders: {
    id: string;
    name: string;
    type: "image" | "text";
    label: string;
    requiredByUser: boolean;
    defaultValue: string | null;
  }[];
};

// HACK: bei den abfragen muss allgemein userId und orgId mit geprüft werden!

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

/**
 * Init Agent
 */
export const initAgentsSystemPrompt = async (
  userId: string,
  organisationId: string,
  query: {
    promptId?: string;
    promptName?: string;
    promptCategory?: string;
  }
): Promise<AgentSystemPrompt> => {
  const promptTemplate = await getPromptTemplateDefinition(query).catch(
    () => null
  );
  if (!promptTemplate) {
    return {
      id: "",
      name: "",
      llmOptions: {},
      category: "",
      label: "",
      template: `You are a helpful assistant and will help the user with his questions. You will answer to everything. Your answer will be in the language of the user.`,
      langCode: null,
      needsInitialCall: false,
      promptTemplatePlaceholders: [],
    };
  } else
    return {
      id: promptTemplate.id,
      name: promptTemplate.name,
      category: promptTemplate.category,
      label: promptTemplate.label,
      template: promptTemplate.template,
      langCode: promptTemplate.langCode,
      needsInitialCall: promptTemplate.needsInitialCall,
      promptTemplatePlaceholders: promptTemplate.promptTemplatePlaceholders.map(
        (placeholder) => ({
          id: placeholder.id,
          name: placeholder.name,
          type: placeholder.type,
          label: placeholder.label,
          requiredByUser: placeholder.requiredByUser,
          defaultValue: placeholder.defaultValue,
        })
      ),
      llmOptions: promptTemplate.llmOptions ?? {},
    };
};

/**
 * Init a chat message
 */
export const initChatMessage = (
  message: string,
  role: ChatMessageRole = "system"
) => {
  const chatMessage: ChatMessage = {
    role: role,
    content: message,
  };
  return chatMessage;
};
