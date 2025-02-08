/**
 * Routes to CHAT with the AI models
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../types";
import { HTTPException } from "hono/http-exception";
import { RESPONSES } from "../../../../lib/responses";
import { getAllAIModels } from "../../../../lib/ai/standard";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";
import { chatWithAgent } from "../../../../lib/ai/chat";
import { chatStore } from "../../../../lib/ai/chat/chat-store";

export default function defineRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**
   * Get all available models
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/models",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      const r = await getAllAIModels();
      return c.json(r);
    }
  );

  /**
   * Main CHAT Route. Can handle simple and complex chats.
   * Chat with a Prompt Template
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat-with-template",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const usersId = c.get("usersId");
        const organisationId = c.req.param("organisationId");
        const r = await chatWithAgent({
          ...body,
          userId: usersId,
          organisationId,
        });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, {
          message: e + "",
        });
      }
    }
  );

  /**
   * Chat History for the current user
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat/history",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      const usersId = c.get("usersId");
      const organisationId = c.req.param("organisationId");
      const startFrom = c.req.query("startFrom") ?? "2000-01-01";
      const r = await chatStore.getHistoryByUserId(usersId, startFrom, {
        organisationId,
      });
      return c.json(r);
    }
  );

  /**
   * Chat History for one chat session
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat/history/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      const id = c.req.param("id");
      // const organisationId = c.req.param("organisationId");
      const r = await chatStore.get(id);
      if (!r) {
        throw new HTTPException(404, {
          message: `Chat session ${id} not found`,
        });
      }
      return c.json({
        chatId: id,
        name: r.name,
        history: r.messages,
      });
    }
  );

  /**
   * Drop a chat session by ID
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat/history/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      const id = c.req.param("id");
      // const organisationId = c.req.param("organisationId");
      await chatStore.drop(id);
      return c.json(RESPONSES.SUCCESS);
    }
  );
}
