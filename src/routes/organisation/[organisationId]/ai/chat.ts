/**
 * Routes to CHAT with the AI models
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../types";
import { HTTPException } from "hono/http-exception";
import { RESPONSES } from "../../../../lib/responses";
import {
  aiModelsValidationSchema,
  getAllAIModels,
} from "../../../../lib/ai/standard";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";
import {
  chatInitInputValidation,
  chatWithAgent,
  chatWithTemplateReturnValidation,
  createEmptySession,
} from "../../../../lib/ai/chat";
import {
  interviewRespondInputValidation,
  interviewRespondOutputValidation,
  respondInInterview,
} from "../../../../lib/ai/chat/interview";
import { chatStore } from "../../../../lib/ai/chat/chat-store";
import * as v from "valibot";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { chatSessionsSelectSchema } from "../../../../dbSchema";

// Define the roles as a type
type ChatMessageRole = "system" | "user" | "assistant";

export default function defineRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**
   * Get all available models
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/models",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/models",
      tags: ["ai"],
      summary: "Get all available models",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(aiModelsValidationSchema),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      const { organisationId } = c.req.valid("param");
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
    async (c) => {
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
    async (c) => {
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
    async (c) => {
      const { organisationId, id } = c.req.valid("param");
      await chatStore.drop(id);
      return c.json(RESPONSES.SUCCESS);
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
        chatId: v.optional(v.string()),
        chatSessionGroupId: v.optional(v.string()),
      })
    ),
    async (c) => {
      try {
        const data = c.req.valid("json");
        const usersId = c.get("usersId");
        const { organisationId } = c.req.valid("param");

        const session = await createEmptySession({
          userId: usersId,
          organisationId,
          chatId: data.chatId,
          chatSessionGroupId: data.chatSessionGroupId,
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
   * Start a new interview session
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/interview/start",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/interview/start",
      tags: ["ai"],
      summary: "Start a new interview session",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  chatId: v.string(),
                  name: v.string(),
                  interview: v.object({
                    name: v.string(),
                    description: v.string(),
                    guidelines: v.string(),
                  }),
                })
              ),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        interviewName: v.string(),
        description: v.string(),
        guidelines: v.string(),
      })
    ),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const body = c.req.valid("json");
        const usersId = c.get("usersId");
        const { organisationId } = c.req.valid("param");

        // Create new session with interview data
        const session = await chatStore.create({
          messages: [],
          variables: {}, // or pass in any additional variables
          context: {
            userId: usersId,
            organisationId,
          },
          interview: {
            name: body.interviewName ?? "New Interview",
            description: body.description ?? "",
            guidelines: body.guidelines ?? "",
          },
        });

        return c.json({
          chatId: session.id,
          name: session.name,
          interview: session.state.interview,
        });
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Submit response to interview question
   * Calls our "respondInInterview" middleware
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/interview/:chatId/respond",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/interview/:chatId/respond",
      tags: ["ai"],
      summary: "Submit response to interview question",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(interviewRespondOutputValidation),
            },
          },
        },
      },
    }),
    validator("json", interviewRespondInputValidation),
    validator(
      "param",
      v.object({ organisationId: v.string(), chatId: v.string() })
    ),
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId, chatId } = c.req.valid("param");
        const usersId = c.get("usersId");

        // We'll call our interview "middleware" function:
        const result = await respondInInterview({
          userId: usersId,
          organisationId,
          chatId,
          user_input: body.user_input ?? "",
          llmOptions: body.llmOptions,
        });

        return c.json(result);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
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
    async (c) => {
      try {
        const { organisationId, chatId, messageId } = c.req.valid("param");
        const { content } = c.req.valid("json");
        // Update the chat message
        await chatStore.updateChatMessage(chatId, messageId, { content });
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
