import {
  addPromptTemplate,
  addPromptTemplatePlaceholder,
  deletePromptTemplate,
  deletePromptTemplatePlaceholder,
  getPlaceholdersForPromptTemplate,
  getPlainPlaceholdersForPromptTemplate,
  getPlainTemplate,
  getTemplates,
  updatePromptTemplate,
  updatePromptTemplatePlaceholder,
} from "../../lib/ai/generation/crud";
import { functionChat } from "../../lib/ai/smart-chat";
import type { FastAppHono } from "../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import {
  addKnowledgeFromUrl,
  extractKnowledgeFromText,
} from "../../lib/ai/knowledge/add-knowledge";
import { parseDocument } from "../../lib/ai/parsing";
import { useTemplateChat } from "../../lib/ai/generation";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  deleteKnowledgeEntry,
  getKnowledgeEntries,
} from "../../lib/ai/knowledge/get-knowledge";
import {
  addFineTuningData,
  deleteFineTuningData,
  getFineTuningEntries,
  getFineTuningEntryById,
  updateFineTuningData,
} from "../../lib/ai/fine-tuning";
import { parseCommaSeparatedListFromUrlParam } from "../../lib/url";
import { RESPONSES } from "../../lib/responses";

const FileSourceType = {
  DB: "db",
  LOCAL: "local",
  URL: "url",
  TEXT: "text",
} as const;

const chatWithTemplateValidation = v.object({
  chatId: v.optional(v.string()),
  initiateTemplate: v.optional(
    v.object({
      promptId: v.optional(v.string()),
      promptName: v.optional(v.string()),
      promptCategory: v.optional(v.string()),
    })
  ),
  trigger: v.optional(
    v.object({
      next: v.boolean(),
      skip: v.boolean(),
    })
  ),
  userMessage: v.optional(v.string()),
  variables: v.optional(
    v.record(v.string(), v.union([v.string(), v.number(), v.boolean()]))
  ),
});
export type ChatWithTemplateInput = v.InferOutput<
  typeof chatWithTemplateValidation
>;

const generateKnowledgeValidation = v.object({
  fileSourceType: v.enum(FileSourceType),
  fileSourceId: v.optional(v.string()),
  fileSourceBucket: v.optional(v.string()),
  fileSourceUrl: v.optional(v.string()),
  category1: v.optional(v.string()),
  category2: v.optional(v.string()),
  category3: v.optional(v.string()),
});
export type GenerateKnowledgeInput = v.InferOutput<
  typeof generateKnowledgeValidation
>;

const askKnowledgeValidation = v.object({
  question: v.string(),
  countChunks: v.optional(v.number()),
  addBeforeN: v.optional(v.number()),
  addAfterN: v.optional(v.number()),
  filterKnowledgeEntryIds: v.optional(v.array(v.string())),
});
export type AskKnowledgeInput = v.InferOutput<typeof askKnowledgeValidation>;

const parseDocumentValidation = v.object({
  fileSourceType: v.enum(FileSourceType),
  fileSourceId: v.optional(v.string()),
  fileSourceBucket: v.optional(v.string()),
  fileSourceUrl: v.optional(v.string()),
});
export type ParseDocumentInput = v.InferOutput<typeof parseDocumentValidation>;

const simpleChatValidation = v.object({
  chatId: v.optional(v.string()),
  userMessage: v.string(),
});
export type SimpleChatInput = v.InferOutput<typeof simpleChatValidation>;

// Add new validation schema
const fineTuningDataValidation = v.object({
  name: v.optional(v.string()),
  category: v.optional(v.string()),
  data: v.array(
    v.object({
      question: v.string(),
      answer: v.string(),
    })
  ),
});
export type FineTuningDataInput = v.InferOutput<
  typeof fineTuningDataValidation
>;

/**
 * Define the payment routes
 */
export default function defineRoutes(app: FastAppHono) {
  /**
   * AI chatbot with function calling
   */
  app.post("/smart-chat", async (c) => {
    try {
      const body = await c.req.json();
      const parsedBody = v.parse(simpleChatValidation, body);
      const messages: ChatCompletionMessageParam[] = [
        { role: "user", content: parsedBody.userMessage },
      ];
      const response = await functionChat(parsedBody.chatId, messages);
      return c.json(response);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Get a plain template
   */
  app.get("/templates", async (c) => {
    try {
      const promptId = c.req.query("promptId");
      const promptName = c.req.query("promptName");
      const promptCategory = c.req.query("promptCategory");
      if (!promptId && !promptName && !promptCategory) {
        const r = await getTemplates();
        return c.json(r);
      }
      const r = await getPlainTemplate({
        promptId,
        promptName,
        promptCategory,
      });
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Add a new prompt template
   */
  app.post("/templates", async (c) => {
    try {
      const body = await c.req.json();
      const r = await addPromptTemplate(body);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Update a prompt template by ID
   */
  app.put("/templates/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const r = await updatePromptTemplate({ ...body, id });
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Delete a prompt template by ID
   */
  app.delete("/templates/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const r = await deletePromptTemplate(id);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Get all placeholders for a prompt template by ID
   */
  app.get("/templates/:id/placeholders", async (c) => {
    try {
      const id = c.req.param("id");
      const r = await getPlainPlaceholdersForPromptTemplate(id);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Add a new placeholder to a prompt template
   */
  app.post("/templates/:promptTemplateId/placeholders", async (c) => {
    try {
      const promptTemplateId = c.req.param("promptTemplateId");
      const body = await c.req.json();
      const r = await addPromptTemplatePlaceholder({
        ...body,
        promptTemplateId,
      });
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Update a prompt-template placeholder by ID
   */
  app.put("/templates/:promptTemplateId/placeholders/:id", async (c) => {
    try {
      const promptTemplateId = c.req.param("promptTemplateId");
      const id = c.req.param("id");
      const body = await c.req.json();
      const r = await updatePromptTemplatePlaceholder({
        ...body,
        id,
        promptTemplateId: promptTemplateId,
      });
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Delete a placeholder for a prompt template by ID
   */
  app.delete("/templates/:promptTemplateId/placeholders/:id", async (c) => {
    try {
      const promptTemplateId = c.req.param("promptTemplateId");
      const id = c.req.param("id");
      const r = await deletePromptTemplatePlaceholder(id, promptTemplateId);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Get an object with all placeholders for a prompt template with the default values
   */
  app.get("/get-placeholders", async (c) => {
    try {
      const promptId = c.req.query("promptId");
      const promptName = c.req.query("promptName");
      const promptCategory = c.req.query("promptCategory");
      const r = await getPlaceholdersForPromptTemplate({
        promptId,
        promptName,
        promptCategory,
      });
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Chat with a Prompt Template
   */
  app.post("/chat-with-template", async (c) => {
    try {
      const body = await c.req.json();
      const parsedBody = v.parse(chatWithTemplateValidation, body);
      const r = await useTemplateChat(parsedBody);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, {
        message: e + "",
      });
    }
  });

  /**
   * Parse a document
   */
  app.post("/parse-document", async (c) => {
    try {
      const body = await c.req.json();
      const parsedBody = v.parse(parseDocumentValidation, body);
      const r = await parseDocument(parsedBody);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Call the knowledge extraction from a text to gnerate knowledge in the database
   */
  app.post("/generate-knowledge", async (c) => {
    try {
      const body = await c.req.json();
      const parsedBody = v.parse(generateKnowledgeValidation, body);
      const r = await extractKnowledgeFromText(parsedBody);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, {
        message: e + "",
      });
    }
  });

  /**
   * Get all knowledge entries
   * URL params:
   * - limit: number
   * - page: number
   */
  app.get("/knowledge-entries", async (c) => {
    try {
      const limitStr = c.req.query("limit");
      const pageStr = c.req.query("page");
      const limit = parseInt(limitStr ?? "100");
      const page = parseInt(pageStr ?? "0");
      const r = await getKnowledgeEntries({ limit, page });
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Delete a knowledge entry by ID
   */
  app.delete("/knowledge-entries/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const r = await deleteKnowledgeEntry(id);
      return c.json(RESPONSES.SUCCESS);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Get fine-tuning data with nested knowledge entry
   * Optional URL params are:
   * - name: string[] comma separated
   * - category: string[] comma separated
   */
  app.get("/fine-tuning/:id?", async (c) => {
    try {
      const id = c.req.param("id");
      const names = parseCommaSeparatedListFromUrlParam(
        c.req.query("name"),
        []
      );
      const categories = parseCommaSeparatedListFromUrlParam(
        c.req.query("category"),
        []
      );
      // only return one item?
      if (id) {
        const data = await getFineTuningEntryById(id);
        return c.json(data);
      } // else
      const data = await getFineTuningEntries({ names, categories });
      return c.json(data);
    } catch (err) {
      throw new HTTPException(400, { message: err + "" });
    }
  });

  /**
   * Add new fine-tuning data
   */
  app.post("/fine-tuning", async (c) => {
    try {
      const body = await c.req.json();
      const parsedBody = v.parse(fineTuningDataValidation, body);
      const r = await addFineTuningData(parsedBody);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Update fine-tuning data
   */
  app.put("/fine-tuning/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const parsedBody = v.parse(fineTuningDataValidation, body);
      const r = await updateFineTuningData(id, parsedBody);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Delete fine-tuning data
   */
  app.delete("/fine-tuning/:id", async (c) => {
    try {
      const id = c.req.param("id");
      await deleteFineTuningData(id);
      return c.json(RESPONSES.SUCCESS);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Add a text knowledge entry from an URL
   */
  app.post("/add-textknowledge-from-url", async (c) => {
    try {
      const body = await c.req.json();
      const url: string = body.url;
      const r = await addKnowledgeFromUrl(url);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });
}
