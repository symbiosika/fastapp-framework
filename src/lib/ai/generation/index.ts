import {
  standardSingleLineParsers,
  TemplateChat,
  type LlmWrapper,
  type TemplateChatLogger,
} from "magic-prompt";
import { generateLongText } from "../standard";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/db-connection";
import { promptTemplates } from "../../../lib/db/db-schema";
import log from "../../../lib/log";

import type { ChatWithTemplateReturn } from "../../../types";
import { chatStoreInDb } from "../smart-chat/chat-history";
import { ChatWithTemplateInputWithUserId } from "../../../routes/ai/chat";
import { customAppPlaceholders } from "./custom-placeholders";

/**
 * Wrapper function for generateLongText that matches the LlmWrapper type signature
 */
export const generateLongTextWrapper: LlmWrapper = async (
  messages,
  logger,
  options
) => {
  // console.log("generateLongTextWrapper logger", logger);
  // console.log("generateLongTextWrapper options", options);
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
      chatId: query.chatId,
      userId: query.userId,
      userMessage: query.userMessage,
      llmOptions: query.llmOptions,
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
