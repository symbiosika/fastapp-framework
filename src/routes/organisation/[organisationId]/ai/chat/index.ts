/**
 * Routes to CHAT with the AI models
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../../types";
import { HTTPException } from "hono/http-exception";
import { RESPONSES } from "../../../../../lib/responses";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../../lib/utils/hono-middlewares";
import {
  chatInitInputValidation,
  chatInputValidation,
  chatWithAgent,
  chatWithTemplateReturnValidation,
  createEmptySession,
} from "../../../../../lib/ai/chat";
import { chatStore } from "../../../../../lib/ai/chat/chat-store";
import * as v from "valibot";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { chatSessionsSelectSchema } from "../../../../../dbSchema";
import { isOrganisationMember } from "../../..";

export default function defineRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**
   * Main CHAT Route. Can handle simple and complex chats.
   * Chat with a Prompt Template
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat-with-template",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/chat-with-template",
      tags: ["ai"],
      summary: "Chat with a Prompt Template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(chatWithTemplateReturnValidation),
            },
          },
        },
      },
    }),
    validator("json", chatInitInputValidation),
    isOrganisationMember,
    async (c) => {
      try {
        const body = c.req.valid("json");
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
   * The new main CHAT Route. Can handle simple and complex chats.
   * Chat use assistants, tools, knowledge and more.
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/chat",
      tags: ["ai"],
      summary: "Chat with a Prompt Template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(chatWithTemplateReturnValidation),
            },
          },
        },
      },
    }),
    validator("json", chatInputValidation),
    isOrganisationMember,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const usersId = c.get("usersId");
        const organisationId = c.req.param("organisationId");

        
        
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
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/chat/history",
      tags: ["ai"],
      summary: "Chat History for the current user",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(chatSessionsSelectSchema),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        startFrom: v.optional(v.string()),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const usersId = c.get("usersId");
        const { organisationId, startFrom } = c.req.valid("param");
        const r = await chatStore.getHistoryByUserId(
          usersId,
          startFrom ?? "2000-01-01",
          {
            organisationId,
          }
        );
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Chat History for one chat session
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat/history/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/chat/history/:id",
      tags: ["ai"],
      summary: "Chat History for one chat session",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  chatId: v.string(),
                  name: v.string(),
                  history: v.any(),
                  chatSessionGroupId: v.optional(v.string()),
                  parentWorkspaceId: v.optional(v.string()),
                })
              ),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        const r = await chatStore.get(id);
        if (!r) {
          throw new HTTPException(404, {
            message: `Chat session ${id} not found`,
          });
        }

        // check if the chat session is in a chat session group
        const parentWorkspace = await chatStore.getParentWorkspaceByChatGroupId(
          r.chatSessionGroupId
        );

        return c.json({
          chatId: id,
          name: r.name,
          history: r.messages,
          chatSessionGroupId: r.chatSessionGroupId,
          parentWorkspaceId: parentWorkspace?.workspaceId,
        });
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Drop a chat session by ID
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat/history/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/chat/history/:id",
      tags: ["ai"],
      summary: "Drop a chat session by ID",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        await chatStore.drop(id);
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Create an empty chat session
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat/ensure-session",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/chat/ensure-session",
      tags: ["ai"],
      summary: "Create an empty chat session",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.object({ chatId: v.string() })),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    validator(
      "json",
      v.object({
        chatId: v.optional(v.nullable(v.string())),
        chatSessionGroupId: v.optional(v.nullable(v.string())),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const data = c.req.valid("json");
        const usersId = c.get("usersId");
        const { organisationId } = c.req.valid("param");

        const session = await createEmptySession({
          userId: usersId,
          organisationId,
          chatId: data.chatId ?? undefined,
          chatSessionGroupId: data.chatSessionGroupId ?? undefined,
        });
        return c.json(session);
      } catch (e) {
        throw new HTTPException(400, {
          message: e + "",
        });
      }
    }
  );

  /**
   * Update a chat message in a session
   */
  app.put(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/chat/:chatId/message/:messageId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/chat/:chatId/message/:messageId",
      tags: ["ai"],
      summary: "Update a chat message in a session",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.object({ success: v.boolean() })),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        content: v.optional(v.string()),
      })
    ),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        chatId: v.string(),
        messageId: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, chatId, messageId } = c.req.valid("param");
        const { content } = c.req.valid("json");
        // Update the chat message
        await chatStore.updateChatMessage(
          chatId,
          messageId,
          { content },
          organisationId
        );
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
