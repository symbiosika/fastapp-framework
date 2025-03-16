import { getDb } from "../../../lib/db/db-connection";
import {
  type KnowledgeEntrySelect,
  type LLMOptions,
  promptTemplates,
} from "../../../lib/db/db-schema";
import { eq, and } from "drizzle-orm";
import type { ChatArtifactDictionary, ChatMessageRole } from "./chat-store";
import type { ChatMessage } from "./chat-store";
import { nanoid } from "nanoid";

export type AgentSystemPrompt = {
  id: string;
  name: string;
  category: string;
  label: string;
  systemPrompt: string;
  userPrompt: string | null;
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
  id: string,
  returnHiddenEntries = true
) => {
  let where;
  if (!returnHiddenEntries) {
    where = and(eq(promptTemplates.hidden, false), eq(promptTemplates.id, id));
  } else {
    where = eq(promptTemplates.id, id);
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
  name: string,
  category: string,
  returnHiddenEntries = true
) => {
  let where;
  if (!returnHiddenEntries) {
    where = and(
      eq(promptTemplates.hidden, false),
      eq(promptTemplates.name, name),
      eq(promptTemplates.category, category)
    );
  } else {
    where = and(
      eq(promptTemplates.name, name),
      eq(promptTemplates.category, category)
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
    id?: string;
    name?: string;
    category?: string;
  },
  returnHiddenEntries = true
) => {
  if (query.id) {
    return await getPromptTemplateById(query.id, returnHiddenEntries);
  } else if (query.name && query.category) {
    return await getPromptTemplateByNameAndCategory(
      query.name,
      query.category,
      returnHiddenEntries
    );
  }
  throw new Error("Either id or name and category have to be set.");
};

/**
 * Init Agent
 */
export const initAgentsSystemPrompt = async (
  userId: string,
  organisationId: string,
  query: {
    id?: string;
    name?: string;
    category?: string;
  }
): Promise<AgentSystemPrompt> => {
  const promptTemplate = await getPromptTemplateDefinition(query).catch(
    () => null
  );
  if (!promptTemplate) {
    const systemPrompt = `You are a highly knowledgeable assistant dedicated to solving a wide range of general tasks.
    For every user query, provide responses that are both comprehensive and easy to follow.
    Always format your answers using well-structured Markdown:
    include clear headings, bullet points, and code blocks where appropriate. Prioritize clarity, conciseness, and best practices, ensuring your responses are both professional and visually engaging.`;

    return {
      id: "",
      name: "",
      llmOptions: {},
      category: "",
      label: "",
      systemPrompt,
      userPrompt: null,
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
      systemPrompt: promptTemplate.systemPrompt,
      userPrompt: promptTemplate.userPrompt,
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
  role: ChatMessageRole = "system",
  meta?: {
    provider?: string;
    model?: string;
    human?: boolean;
    timestamp?: string;
    documents?: {
      knowledgeEntries?: KnowledgeEntrySelect[];
    };
    thinkings?: string[];
    citations?: string[];
  },
  artifacts?: ChatArtifactDictionary
) => {
  const id = nanoid(16);
  const chatMessage: ChatMessage = {
    role: role,
    content: message,
    meta: { ...meta, id },
    artifacts,
  };
  return chatMessage;
};
