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
import { extractKnowledgeFromText } from "../../lib/ai/knowledge/add-knowledge";
import { FileSourceType } from "../../lib/storage";
import { askKnowledge } from "../../lib/ai/knowledge/search";
import { parseDocument } from "../../lib/ai/parsing";
import {
  shortenString,
  textGenerationByPromptTemplate,
} from "../../lib/ai/generation";
import {
  fineTuningData,
  knowledgeEntry,
  knowledgeText,
} from "../../lib/db/schema/knowledge";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../lib/db/db-connection";
import type { ServerChatItem } from "../../lib/ai/smart-chat/shared-types";
import { getMarkdownFromUrl } from "../../lib/ai/parsing/url";
import log from "../../lib/log";
import { chatStore } from "../../lib/ai/smart-chat/chat-history";
import { simpleChat } from "src/lib/ai/simple-chat";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

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
  usersMessage: v.string(),
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
    const body = await c.req.json();
    const parsedBody = v.parse(simpleChatValidation, body);
    const messages: ChatCompletionMessageParam[] = [
      { role: "user", content: parsedBody.usersMessage },
    ];
    const response = await functionChat(parsedBody.chatId, messages);
    return c.json(response);
  });

  /**
   * AI chatbot with template functions
   */
  app.post("/template-chat", async (c) => {
    const body = await c.req.json();
    const parsedBody = v.parse(simpleChatValidation, body);
    const response = await simpleChat(
      parsedBody.chatId,
      parsedBody.usersMessage
    );
    return c.json(response);
  });

  /**
   * Get a plain template
   */
  app.get("/templates", async (c) => {
    const promptId = c.req.query("promptId");
    const promptName = c.req.query("promptName");
    const promptCategory = c.req.query("promptCategory");

    if (!promptId && !promptName && !promptCategory) {
      const r = await getTemplates();
      return c.json(r);
    }

    const r = await getPlainTemplate({ promptId, promptName, promptCategory });
    return c.json(r);
  });

  /**
   * Add a new prompt template
   */
  app.post("/templates", async (c) => {
    const body = await c.req.json();
    const r = await addPromptTemplate(body);
    return c.json(r);
  });

  /**
   * Update a prompt template by ID
   */
  app.put("/templates/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const r = await updatePromptTemplate({ ...body, id });
    return c.json(r);
  });

  /**
   * Delete a prompt template by ID
   */
  app.delete("/templates/:id", async (c) => {
    const id = c.req.param("id");
    const r = await deletePromptTemplate(id);
    return c.json(r);
  });

  /**
   * Get all placeholders for a prompt template by ID
   */
  app.get("/templates/:id/placeholders", async (c) => {
    const id = c.req.param("id");
    const r = await getPlainPlaceholdersForPromptTemplate(id);
    return c.json(r);
  });

  /**
   * Add a new placeholder to a prompt template
   */
  app.post("/templates/:promptTemplateId/placeholders", async (c) => {
    const promptTemplateId = c.req.param("promptTemplateId");
    const body = await c.req.json();
    const r = await addPromptTemplatePlaceholder({
      ...body,
      promptTemplateId,
    });
    return c.json(r);
  });

  /**
   * Update a prompt-template placeholder by ID
   */
  app.put("/templates/:promptTemplateId/placeholders/:id", async (c) => {
    const promptTemplateId = c.req.param("promptTemplateId");
    const id = c.req.param("id");
    const body = await c.req.json();
    const r = await updatePromptTemplatePlaceholder({
      ...body,
      id,
      promptTemplateId: promptTemplateId,
    });
    return c.json(r);
  });

  /**
   * Delete a placeholder for a prompt template by ID
   */
  app.delete("/templates/:promptTemplateId/placeholders/:id", async (c) => {
    const promptTemplateId = c.req.param("promptTemplateId");
    const id = c.req.param("id");
    const r = await deletePromptTemplatePlaceholder(id, promptTemplateId);
    return c.json(r);
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

      // set history in the server
      const session = chatStore.get();

      const result: ServerChatItem = {
        chatId: session.id,
        renderType: "markdown",
        role: "assistant",
        content: r.responses[r.lastOutputVarName],
      };

      return c.json(result);
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
   * Get all knowledge entries
   */
  app.get("/knowledge-entries", async (c) => {
    const r = await getDb().query.knowledgeEntry.findMany();
    return c.json(r);
  });

  /**
   * Delete a knowledge entry by ID
   */
  app.delete("/knowledge-entries/:id", async (c) => {
    const id = c.req.param("id");
    const r = await getDb()
      .delete(knowledgeEntry)
      .where(eq(knowledgeEntry.id, id));
    return c.json({ success: true });
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

  /**
   * Get fine-tuning data with nested knowledge entry
   * Optional URL params are:
   * - name: string[]
   * - category: string[]
   */
  app.get("/fine-tuning/:id?", async (c) => {
    try {
      const id = c.req.param("id");
      const name = c.req.query("name");
      const category = c.req.query("category");

      // only return one item?
      if (id) {
        const data = await getDb().query.fineTuningData.findFirst({
          where: eq(fineTuningData.id, id),
          with: {
            knowledgeEntry: true,
          },
        });
        return c.json(data);
      }

      // else return all items filtered by the given name and category
      let names: string[] = [];
      if (name) {
        names = name.split(",");
      }
      let categories: string[] = [];
      if (category) {
        categories = category.split(",");
      }

      let where;
      if (names.length > 0) {
        where = inArray(fineTuningData.name, names);
      } else if (categories.length > 0) {
        where = inArray(fineTuningData.category, categories);
      } else if (names.length > 0 && categories.length > 0) {
        where = and(
          inArray(fineTuningData.name, names),
          inArray(fineTuningData.category, categories)
        );
      }

      const data = await getDb().query.fineTuningData.findMany({
        where,
        with: {
          knowledgeEntry: true,
        },
      });
      if (!data) {
        throw new HTTPException(404, { message: "Fine-tuning data not found" });
      }
      return c.json(data);
    } catch (err) {
      throw new HTTPException(400, { message: err + "" });
    }
  });

  /**
   * Add new fine-tuning data
   */
  app.post("/fine-tuning", async (c) => {
    const body = await c.req.json();
    try {
      const parsedBody = v.parse(fineTuningDataValidation, body);

      // Create knowledge entry first
      const knowledgeEntryResult = await getDb()
        .insert(knowledgeEntry)
        .values({
          fileSourceType: "finetuning",
          name: parsedBody.name || "Unnamed Fine-tuning Dataset",
          description: `Fine-tuning dataset${parsedBody.category ? ` for ${parsedBody.category}` : ""}`,
        })
        .returning();

      // Insert all QA pairs
      const fineTuningEntries = await getDb()
        .insert(fineTuningData)
        .values(
          parsedBody.data.map((item) => ({
            knowledgeEntryId: knowledgeEntryResult[0].id,
            name: parsedBody.name,
            category: parsedBody.category,
            question: item.question,
            answer: item.answer,
          }))
        )
        .returning();

      return c.json(fineTuningEntries);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Update fine-tuning data
   */
  app.put("/fine-tuning/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();

    try {
      const parsedBody = v.parse(fineTuningDataValidation, body);

      // Delete existing data
      await getDb().delete(fineTuningData).where(eq(fineTuningData.id, id));

      // Insert new data
      const fineTuningEntries = await getDb()
        .insert(fineTuningData)
        .values(
          parsedBody.data.map((item) => ({
            knowledgeEntryId: id,
            name: parsedBody.name,
            category: parsedBody.category,
            question: item.question,
            answer: item.answer,
          }))
        )
        .returning();

      return c.json({ success: true });
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Delete fine-tuning data
   */
  app.delete("/fine-tuning/:id", async (c) => {
    const id = c.req.param("id");
    await getDb().delete(fineTuningData).where(eq(fineTuningData.id, id));
    return c.json({ success: true });
  });

  /**
   * Add a text knowledge entry from an URL
   */
  app.post("/add-textknowledge-from-url", async (c) => {
    const body = await c.req.json();
    const url: string = body.url;
    try {
      const markdown = await getMarkdownFromUrl(url);
      log.debug(`Markdown: ${shortenString(markdown, 100)}`);

      // insert in DB as text knowledge entry
      const e = await getDb()
        .insert(knowledgeText)
        .values({
          text: markdown,
          title: url,
        })
        .returning({
          id: knowledgeText.id,
          title: knowledgeText.title,
          createdAt: knowledgeText.createdAt,
        });

      return c.json(e);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });
}
