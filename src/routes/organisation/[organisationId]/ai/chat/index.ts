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
import * as v from "valibot";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { chatSessionsSelectSchema } from "../../../../../dbSchema";
import { isOrganisationMember } from "../../..";
import {
  chat,
  type ChatInputValidation,
  chatInputValidation,
} from "../../../../../lib/ai/interaction";
import { chatInitInputValidation } from "../../../../../lib/ai/chat-store/compatibility";
import { chatWithTemplateReturnValidation } from "../../../../../lib/ai/chat-store/compatibility";
import { chatStore } from "../../../../../lib/ai/chat-store";
import { validateScope } from "../../../../../lib/utils/validate-scope";
import { getLiveChat } from "../../../../../lib/ai/chat-store/live-chat-cache";

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
    validateScope("ai:chat"),
    validator("json", chatInitInputValidation),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const usersId = c.get("usersId");
        const { organisationId } = c.req.valid("param");

        // Transform old format to new format
        const newFormatInput: ChatInputValidation = {
          chatId: body.chatId,
          context: {
            chatSessionGroupId: body.chatSessionGroupId,
            organisationId,
            userId: usersId,
          },
          // Convert initiateTemplate to useTemplate if present
          useTemplate: body.initiateTemplate
            ? body.initiateTemplate.promptCategory &&
              body.initiateTemplate.promptName
              ? `${body.initiateTemplate.promptCategory}:${body.initiateTemplate.promptName}`
              : body.initiateTemplate.promptId
            : undefined,
          variables: body.variables,
          enabledTools: body.enabledTools,
          // Convert llmOptions to options
          options: body.llmOptions
            ? {
                model: body.llmOptions.model,
                maxTokens: body.llmOptions.maxTokens,
                temperature: body.llmOptions.temperature,
              }
            : undefined,
          // Use user_input from variables or empty string as input
          input: body.variables?.user_input || "",
        };

        // Call new chat function with transformed input
        const r = await chat(newFormatInput);

        // Return response in format expected by old endpoint clients
        // (the format is already compatible, but we can add any missing fields if needed)
        return c.json({
          ...r,
          meta: {
            ...(r.message.meta || {}),
            userId: usersId,
            organisationId,
            chatSessionGroupId: body.chatSessionGroupId,
          },
          finished: true,
          llmOptions: body.llmOptions,
          render: { type: "markdown" },
        });
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
    validateScope("ai:chat"),
    validator("json", chatInputValidation),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const usersId = c.get("usersId");
        const { organisationId } = c.req.valid("param");

        const r = await chat({
          ...body,
          context: {
            organisationId,
            userId: usersId,
          },
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
    validateScope("ai:chat-history:read"),
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
    validateScope("ai:chat-history:read"),
    validateScope("ai:chat-history:{{id}}", true),
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
    validateScope("ai:chat-history:write"),
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
    validateScope("ai:chat"),
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

        if (data.chatId) {
          const exists = await chatStore.checkIfSessionExists(data.chatId);
          if (exists) {
            return c.json({ chatId: data.chatId });
          }
        }

        const session = await chatStore.create({
          chatId: data.chatId ?? undefined,
          messages: [],
          variables: {},
          context: {
            userId: usersId,
            organisationId,
            chatSessionGroupId: data.chatSessionGroupId ?? undefined,
          },
        });

        return c.json({ chatId: session.id });
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
    validateScope("ai:chat-history:write"),
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

  /**
   * Live Chat Status Endpoint
   * Retrieves the current state of an ongoing chat generation
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat/live/:chatId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/chat/live/:chatId",
      tags: ["ai"],
      summary: "Get live chat generation status",
      responses: {
        200: {
          description: "Current chat generation status",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  chatId: v.string(),
                  text: v.string(),
                  complete: v.boolean(),
                  meta: v.optional(
                    v.object({
                      toolsUsed: v.optional(v.array(v.string())),
                      sources: v.optional(v.array(v.any())),
                      artifacts: v.optional(v.array(v.any())),
                    })
                  ),
                })
              ),
            },
          },
        },
        404: {
          description: "No live chat data found for the given chatId",
        },
      },
    }),
    validateScope("ai:chat"),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        chatId: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { chatId } = c.req.valid("param");
        const liveData = getLiveChat(chatId);

        if (!liveData) {
          throw new HTTPException(404, {
            message: "No live chat data found",
          });
        }

        return c.json({
          chatId,
          text: liveData.text,
          complete: liveData.complete,
          meta: liveData.meta,
        });
      } catch (e) {
        if (e instanceof HTTPException) {
          throw e;
        }
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
