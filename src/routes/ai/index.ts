import { textGenerationByPromptTemplate } from "../../lib/ai/generation";
import { functionChat } from "../../lib/ai/function-calling";
import type { FastAppHono } from "../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import { extractKnowledgeFromText } from "../../lib/ai/knowledge";
import { FileSourceType } from "../../lib/storage";

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
}
