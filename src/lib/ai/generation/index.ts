import {
  standardSingleLineParsers,
  TemplateChat,
  type LlmWrapper,
  type Message,
  type PlaceholderArgumentDict,
  type PlaceholderParser,
  type TemplateChatLogger,
  type VariableDictionaryInMemory,
} from "magic-prompt";
import { generateLongText } from "../standard";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/db-connection";
import { promptTemplates } from "../../../lib/db/db-schema";
import log from "../../../lib/log";
import { getPlainKnowledge } from "../knowledge/get-knowledge";
import type { FileSourceType } from "../../../lib/storage";
import { parseDocument } from "../parsing";
import { getNearestEmbeddings } from "../knowledge/similarity-search";
import { getMarkdownFromUrl } from "../parsing/url";
import type { ChatWithTemplateInputWithUserId } from "../../../routes/ai";
import type { ChatWithTemplateReturn } from "../../../types";
import { chatStoreInDb } from "../smart-chat/chat-history";

/**
 * Wrapper function for generateLongText that matches the LlmWrapper type signature
 */
export const generateLongTextWrapper: LlmWrapper = async (
  messages,
  options
) => {
  const result = await generateLongText(messages as any, {
    maxTokens: options?.maxTokens,
    model: options?.model,
    temperature: options?.temperature,
    outputType: options?.outputType,
  });
  return result.text;
};

/**
 * Logger Wrapper for the template chat
 */
const templateLogger: TemplateChatLogger = {
  debug: async (...items: any[]) => await log.debug(...items),
  info: async (...items: any[]) =>
    await log.info(...items.map((item) => String(item))),
  error: async (...items: any[]) =>
    await log.error(...items.map((item) => String(item))),
};

const isNumber = (value: unknown): number | null => {
  if (value && typeof value === "number" && !isNaN(value)) {
    return value;
  }
  return null;
};

/**
 * Custom App Placeholders
 */
export const customAppPlaceholders: PlaceholderParser[] = [
  {
    name: "inc_value",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: VariableDictionaryInMemory
    ) => {
      if (!args.variable) {
        throw new Error(
          "variable parameter is required for inc_value placeholder"
        );
      }
      const varName = args.variable + "";
      const actualValue: number = isNumber(variables[varName]) ?? 0;
      const increaseBy: number = isNumber(args.increase) ?? 1;

      variables[varName] = actualValue + increaseBy;
      return { content: "" };
    },
  },
  {
    name: "knowledgebase",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: VariableDictionaryInMemory
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
    }> => {
      let pointerName = args.pointer ? args.pointer + "" : "_chunk_offset";

      let autoIncrease =
        args.auto_increase && typeof args.auto_increase === "boolean"
          ? args.auto_increase
          : true;

      let chunkOffset = isNumber(variables[pointerName]) ?? 0;
      let chunkCount = isNumber(args.chunk_count) ?? undefined;

      // Parse dynamic filters
      const filters: Record<string, string[]> = {};
      Object.entries(args).forEach(([key, value]) => {
        if (key.startsWith("filter:")) {
          const filterKey = key.substring(7); // Remove 'filter:' prefix
          filters[filterKey] = String(value).split(",");
        }
      });

      const query = {
        id: args.id ? [args.id as string] : undefined,
        filters,
        chunkCount,
        chunkOffset,
      };

      await log.debug("parse knowledgebase placeholder", query);
      const knowledgebase = await getPlainKnowledge(query);

      if (knowledgebase.length === 0) {
        await log.debug("no knowledgebase entries found", query);
        return { content: "", skipThisBlock: true };
      }

      // write back to variables
      if (chunkCount && autoIncrease) {
        variables[pointerName] = chunkOffset + chunkCount;
      }
      return { content: knowledgebase.map((k) => k.text).join("\n") };
    },
  },
  {
    name: "similar_to",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict,
      variables: VariableDictionaryInMemory
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
    }> => {
      const searchForVariable = args.search_for_variable
        ? args.search_for_variable + ""
        : "user_input";
      const question = variables[searchForVariable];

      // Parse dynamic filters
      const filters: Record<string, string[]> = {};
      Object.entries(args).forEach(([key, value]) => {
        if (key.startsWith("filter:")) {
          const filterKey = key.substring(7); // Remove 'filter:' prefix
          filters[filterKey] = String(value).split(",");
        }
      });

      const names = args.names ? String(args.names).split(",") : undefined;
      const count =
        args.count && typeof args.count === "number" ? args.count : undefined;
      const before =
        args.before && typeof args.before === "number"
          ? args.before
          : undefined;
      const after =
        args.after && typeof args.after === "number" ? args.after : undefined;
      const ids = args.id ? (args.id as string).split(",") : undefined;
      const organisationId = args.organisationId
        ? args.organisationId + ""
        : "";

      await log.debug("parse similar_to placeholder", {
        organisationId,
        searchText: question,
        count,
        ids,
        filters,
        names,
        before,
        after,
      });
      const results = await getNearestEmbeddings({
        organisationId: organisationId,
        searchText: String(question),
        n: count,
        filterKnowledgeEntryIds: ids,
        filter: filters,
        filterName: names,
        addBeforeN: before,
        addAfterN: after,
      });

      return { content: results.map((r) => r.text).join("\n") };
    },
  },
  {
    name: "file",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
    }> => {
      if (!args.id) {
        throw new Error("id parameter is required for file placeholder");
      }

      const fileSource = (args.source || "db") as FileSourceType;
      const bucket = args.bucket ? args.bucket + "" : "default";
      const id = args.id as string;
      const organisationId = args.organisationId
        ? args.organisationId + ""
        : "";

      await log.debug("parse file placeholder", { fileSource, bucket, id });
      const document = await parseDocument({
        sourceType: fileSource,
        organisationId: organisationId,
        sourceId: id,
        sourceFileBucket: bucket,
      });

      return { content: document.content };
    },
  },
  {
    name: "url",
    replacerFunction: async (
      match: string,
      args: PlaceholderArgumentDict
    ): Promise<{
      content: string;
      skipThisBlock?: boolean;
    }> => {
      if (!args.url) {
        throw new Error("url parameter is required for url placeholder");
      }
      const url = args.url + "";
      await log.debug("parse url placeholder", { url });
      const markdown = await getMarkdownFromUrl(url);
      return { content: markdown };
    },
  },
];

/**
 * Main chat object
 */
export const templateChat = new TemplateChat({
  singleLineParsers: standardSingleLineParsers,
  placeholderParsers: customAppPlaceholders,
  llmWrapper: generateLongTextWrapper,
  logger: templateLogger,
  chatStore: chatStoreInDb,
  defaultTemplate: `{{#block
  name=main_loop
  allow_open_chat=true
}}
  {{#role=assistant}}
    You are a helpful assistant and will help the user with his questions.
    You will answer to everything. Your answer will be in the language of the user.
  {{/role}}

  {{#role=user}}
    {{user_input}}
  {{/role}}
{{/block}}`,
});

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
  data: {
    promptId?: string;
    promptName?: string;
    promptCategory?: string;
  },
  returnHiddenEntries = true
) => {
  if (data.promptId) {
    return await getPromptTemplateById(data.promptId, returnHiddenEntries);
  } else if (data.promptName && data.promptCategory) {
    return await getPromptTemplateByNameAndCategory(
      data.promptName,
      data.promptCategory,
      returnHiddenEntries
    );
  }
  throw new Error(
    "Either promptId or promptName and promptCategory have to be set."
  );
};

/**
 * Generate a headline from a chat interaction
 */
const generateHeadlineFromChat = async (
  userMessage: string,
  assistantResponse: string
) => {
  const templateStr = `{{#block}}
  {{#role=assistant}}
    You are a headline generator. Create a very short, concise headline (max 60 chars) that summarizes 
    the chat interaction between user and assistant. The headline should be in the same language as 
    the conversation.
    
    User message: {{user_message}}
    Assistant response: {{assistant_response}}
  {{/role}}

  {{#role=user}}
    Generate a headline.
  {{/role}}
{{/block}}`;

  const template = await templateChat.getParsedTemplateFromString(templateStr);
  const r = await templateChat.chat({
    userMessage: "Generate a headline.",
    userId: undefined,
    template,
    usersVariables: {
      user_message: userMessage,
      assistant_response: assistantResponse,
    },
  });

  return r.result.message;
};

/**
 * Use the chat
 */
export const useTemplateChat = async (
  query: ChatWithTemplateInputWithUserId
) => {
  let result: ChatWithTemplateReturn;

  if (query.initiateTemplate) {
    const templateDbEntry = await getPromptTemplateDefinition(
      query.initiateTemplate
    );
    const template = await templateChat.getParsedTemplateFromString(
      templateDbEntry.template
    );
    const r = await templateChat.chat({
      llmOptions: query.llmOptions,
      chatId: query.chatId,
      userId: query.userId,
      userMessage: query.userMessage,
      trigger: query.trigger,
      template,
      usersVariables: query.variables,
    });

    result = <ChatWithTemplateReturn>{
      chatId: r.result.chatId,
      message: r.result.message,
      meta: r.result.meta,
      finished: r.result.finished,
      llmOptions: query.llmOptions,
      render: {
        type: "markdown",
      },
    };
  } else {
    // continue a chat
    const r = await templateChat.chat({
      chatId: query.chatId,
      userId: query.userId,
      userMessage: query.userMessage,
      llmOptions: query.llmOptions,
      trigger: query.trigger,
      usersVariables: query.variables,
    });

    result = <ChatWithTemplateReturn>{
      chatId: r.result.chatId,
      message: r.result.message,
      meta: r.result.meta,
      finished: r.result.finished,
      llmOptions: query.llmOptions,
      render: {
        type: "markdown",
      },
    };
  }

  // Generate and update headline if we have a user message and response
  // don't await here. make this in the background
  if (query.userMessage && result.message) {
    generateHeadlineFromChat(query.userMessage, result.message.content).then(
      async (r) => {
        // if the headline starts and ends with quotes remove them
        const headline = r.content.replace(/^"|"$/g, "");
        await chatStoreInDb.set(result.chatId, {
          name: headline,
        });
      }
    );
  }

  return result;
};

/**
 * Generate a knowledgebase answer
 */
export const generateKnowledgebaseAnswer = async (
  question: string,
  query: {
    countChunks: number;
    addBeforeN: number;
    addAfterN: number;
  }
) => {
  const templateStr = `
{{#block}}
  {{#role=assistant}}
    You are a helpful assistant and will help the user with his questions.
    You will answer short and to the point. You will answer to everything.
    Your answer will be in the language of the user.

    Your knowledge about the users question is:
    <knowledgebase>
      {{#similar_to count=${query.countChunks} before=${query.addBeforeN} after=${query.addAfterN}}}
    </knowledgebase>
  {{/role}}

  {{#role=user}}
    {{user_input}}
  {{/role}}
{{/block}}
  `;
  const template = await templateChat.getParsedTemplateFromString(templateStr);

  const r = await templateChat.chat({
    userMessage: question,
    userId: undefined,
    template,
  });

  return r.result;
};
