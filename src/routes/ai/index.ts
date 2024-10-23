import {
  getPlaceholdersForPromptTemplate,
  textGenerationByPromptTemplate,
} from "../../lib/ai/generation";
import { functionChat } from "../../lib/ai/function-calling";
import type { FastAppHono } from "../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import { extractKnowledgeFromText } from "../../lib/ai/knowledge/add-knowledge";
import { FileSourceType } from "../../lib/storage";
import { askKnowledge } from "src/lib/ai/knowledge/search";
import { parseDocument } from "src/lib/ai/parsing";

const generateByTemplateValidation = v.object({
  promptId: v.optional(v.string()),
  promptName: v.optional(v.string()),
  promptCategory: v.optional(v.string()),
  usersPlaceholders: v.optional(
    v.record(
      v.string(),
      v.union([v.string(), v.number(), v.boolean(), v.null(), v.undefined()])
    )
  ),
});
export type GenerateByTemplateInput = v.InferOutput<
  typeof generateByTemplateValidation
>;

const generateKnowledgeValidation = v.object({
  fileSourceType: v.enum(FileSourceType),
  fileSourceId: v.optional(v.string()),
  fileSourceBucket: v.optional(v.string()),
  fileSourceUrl: v.optional(v.string()),
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

/**
 * Define the payment routes
 */
export default function defineRoutes(app: FastAppHono) {
  /**
   * AI chatbot with function calling
   */
  app.post("/smart-chat", async (c) => {
    const body = await c.req.json();
    const chatId = body.chatId ?? undefined;

    let messages = body.messages ?? [];
    const usersMessage = body.usersMessage ?? undefined;
    if (usersMessage) {
      messages = [{ role: "user", content: usersMessage }];
    }
    const response = await functionChat(chatId, messages);
    return c.json(response);
  });

  /**
   * Get an object with all placeholders for a prompt template with the default values
   */
  app.get("/get-placeholders", async (c) => {
    const promptId = c.req.query("promptId");
    const promptName = c.req.query("promptName");
    const promptCategory = c.req.query("promptCategory");
    const r = await getPlaceholdersForPromptTemplate({
      promptId,
      promptName,
      promptCategory,
    }).catch((e) => {
      throw new HTTPException(400, {
        message: e + "",
      });
    });
    return c.json(r);
  });

  /**
   * Call the text generation by a prompt template
   */
  app.post("/generate-with-template", async (c) => {
    const body = await c.req.json();
    try {
      const parsedBody = v.parse(generateByTemplateValidation, body);
      const r = await textGenerationByPromptTemplate(parsedBody);
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
    const body = await c.req.json();
    const parsedBody = v.parse(parseDocumentValidation, body);
    const r = await parseDocument(parsedBody);
    return c.json(r);
  });

  /**
   * Call the knowledge extraction from a text to gnerate knowledge in the database
   */
  app.post("/generate-knowledge", async (c) => {
    const body = await c.req.json();
    try {
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
   * Call the knowledge search
   * Will search for the question in the knowledge base and return the most relevant chunks
   * and give this to a LLM to answer the question
   */
  app.post("/ask-knowledge", async (c) => {
    const body = await c.req.json();
    try {
      const parsedBody = v.parse(askKnowledgeValidation, body);
      const r = await askKnowledge(parsedBody);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, {
        message: e + "",
      });
    }
  });
}
