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
import type { FastAppHono } from "../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import { extractKnowledgeFromExistingDbEntry } from "../../lib/ai/knowledge/add-knowledge";
import { parseDocument } from "../../lib/ai/parsing";
import { useTemplateChat } from "../../lib/ai/generation";
import {
  deleteKnowledgeEntry,
  getFullSourceDocumentsForKnowledgeEntry,
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
import { addKnowledgeFromUrl } from "../../lib/ai/knowledge-texts";
import { chatStoreInDb } from "../../lib/ai/smart-chat/chat-history";

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
type ChatWithTemplateInput = v.InferOutput<typeof chatWithTemplateValidation>;
export type ChatWithTemplateInputWithUserId = ChatWithTemplateInput & {
  userId: string | undefined;
};

const generateKnowledgeValidation = v.object({
  sourceType: v.enum(FileSourceType),
  sourceId: v.optional(v.string()),
  sourceFileBucket: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  filters: v.optional(v.record(v.string(), v.string())),
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
  sourceType: v.enum(FileSourceType),
  sourceId: v.optional(v.string()),
  sourceFileBucket: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
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
   * Get a plain template
   * URL params:
   * - promptId: string (optional)
   * - promptName: string (optional)
   * - promptCategory: string (optional)
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
  app.get("/templates/:promptTemplateId/placeholders", async (c) => {
    try {
      const id = c.req.param("promptTemplateId");
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
  app.get("/templates/placeholders", async (c) => {
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
   * Main CHAT Route. Can handle simple and complex chats.
   * Chat with a Prompt Template
   */
  app.post("/chat-with-template", async (c) => {
    try {
      const body = await c.req.json();
      const usersId = c.get("usersId");
      const parsedBody = v.parse(chatWithTemplateValidation, body);
      const r = await useTemplateChat({ ...parsedBody, userId: usersId });
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
  app.post("/knowledge-texts/parse-document", async (c) => {
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
   * Add a text knowledge entry from an URL
   */
  app.post("/knowledge-texts/from-text", async (c) => {
    try {
      const body = await c.req.json();
      const text: string = body.text;
      if (!text || typeof text !== "string") {
        throw new HTTPException(400, {
          message: "Text is required and must be a string",
        });
      }
      // const r = await addPlainKnowledgeText({ text });
      // return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Add a text knowledge entry from an URL
   */
  app.post("/knowledge-texts/from-url", async (c) => {
    try {
      const body = await c.req.json();
      const url: string = body.url;
      const r = await addKnowledgeFromUrl(url);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Call the knowledge extraction from a document to generate embeddings in the database
   * A document can be a plain text in the DB, a markdown file, an PDF file, an image, etc.
   */
  app.post("/knowledge/extract-knowledge", async (c) => {
    try {
      const body = await c.req.json();
      const parsedBody = v.parse(generateKnowledgeValidation, body);
      const r = await extractKnowledgeFromExistingDbEntry(parsedBody);
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
  app.get("/knowledge/entries", async (c) => {
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
   * Get a full source document for a knowledge entry by ID
   */
  app.get("/knowledge/entries/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const r = await getFullSourceDocumentsForKnowledgeEntry(id);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Delete a knowledge entry by ID
   */
  app.delete("/knowledge/entries/:id", async (c) => {
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
   * Chat History for the current user
   */
  app.get("/chat/history", async (c) => {
    const usersId = c.get("usersId");
    const startFrom = c.req.query("startFrom") ?? "2000-01-01";
    const r = await chatStoreInDb.getHistoryByUserId(usersId, startFrom);
    return c.json(r);
  });

  /**
   * Chat History for one chat session
   */
  app.get("/chat/history/:id", async (c) => {
    const id = c.req.param("id");
    const r = await chatStoreInDb.getChatHistory(id);
    return c.json({
      chatId: id,
      history: r,
    });
  });
}
