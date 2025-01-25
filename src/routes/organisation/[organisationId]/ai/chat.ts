import type { FastAppHono } from "../../../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import { useTemplateChat } from "../../../../lib/ai/generation";
import { RESPONSES } from "../../../../lib/responses";
import { chatStoreInDb } from "../../../../lib/ai/smart-chat/chat-history";
import { getAllAIModels } from "../../../../lib/ai/standard";

const chatWithTemplateValidation = v.object({
  chatId: v.optional(v.string()),
  initiateTemplate: v.optional(
    v.object({
      promptId: v.optional(v.string()),
      promptName: v.optional(v.string()),
      promptCategory: v.optional(v.string()),
      organisationId: v.optional(v.string()),
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
  llmOptions: v.optional(
    v.object({
      model: v.optional(v.string()),
      maxTokens: v.optional(v.number()),
      temperature: v.optional(v.number()),
    })
  ),
});
type ChatWithTemplateInput = v.InferOutput<typeof chatWithTemplateValidation>;
export type ChatWithTemplateInputWithUserId = ChatWithTemplateInput & {
  userId: string | undefined;
};

const simpleChatValidation = v.object({
  chatId: v.optional(v.string()),
  userMessage: v.string(),
});
export type SimpleChatInput = v.InferOutput<typeof simpleChatValidation>;

export default function defineRoutes(app: FastAppHono) {
  /**
   * Get all available models
   */
  app.get("/organisation/:organisationId/ai/models", async (c) => {
    const r = await getAllAIModels();
    return c.json(r);
  });

  /**
   * Main CHAT Route. Can handle simple and complex chats.
   * Chat with a Prompt Template
   */
  app.post("/organisation/:organisationId/ai/chat-with-template", async (c) => {
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
   * Chat History for the current user
   */
  app.get("/organisation/:organisationId/ai/chat/history", async (c) => {
    const usersId = c.get("usersId");
    const startFrom = c.req.query("startFrom") ?? "2000-01-01";
    const r = await chatStoreInDb.getHistoryByUserId(usersId, startFrom);
    return c.json(r);
  });

  /**
   * Chat History for one chat session
   */
  app.get("/organisation/:organisationId/ai/chat/history/:id", async (c) => {
    const id = c.req.param("id");
    const r = await chatStoreInDb.get(id);
    if (!r) {
      throw new HTTPException(404, { message: `Chat session ${id} not found` });
    }
    return c.json({
      chatId: id,
      name: r.name,
      history: r.fullHistory,
    });
  });

  /**
   * Drop a chat session by ID
   */
  app.delete("/organisation/:organisationId/ai/chat/history/:id", async (c) => {
    const id = c.req.param("id");
    await chatStoreInDb.drop(id);
    return c.json(RESPONSES.SUCCESS);
  });
}
