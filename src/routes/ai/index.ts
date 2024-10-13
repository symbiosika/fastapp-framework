import { getTemplatePromptById } from "src/lib/ai/generation";
import { functionChat } from "../../lib/ai/function-calling";
import type { FastAppHono } from "../../types";

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

  app.get("/get-template-prompt/:promptId", async (c) => {
    const promptId = c.req.param("promptId");
    const response = await getTemplatePromptById(promptId);
    return c.json(response);
  });

  app.post("/generate-by-template", async (c) => {
    const body = await c.req.json();
    const promptId = body.promptId;
    const response = await getTemplatePromptById(promptId);
    return c.json(response);
  });
}
