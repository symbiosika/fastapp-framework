/**
 * Routes to CHAT with the AI models
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import { useTemplateChat } from "../../../../lib/ai/generation";
import { RESPONSES } from "../../../../lib/responses";
import { chatStoreInDb } from "../../../../lib/ai/smart-chat/chat-history";
import { getAllAIModels } from "../../../../lib/ai/standard";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";
import { queryChatSessions } from "../../../../lib/chat";
import {
  createChatSessionGroup,
  getChatSessionGroupsByUser,
  updateChatSessionGroup,
  deleteChatSessionGroup,
  addUserToChatSessionGroup,
  addUsersToChatSessionGroup,
  removeUsersFromChatSessionGroup,
} from "../../../../lib/chat/index";

// Validation schemas for chat with template
const chatWithTemplateValidation = v.object({
  chatId: v.optional(v.string()),
  chatSessionGroupId: v.optional(v.string()),
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
  meta: { organisationId: string; userId: string; chatSessionGroupId?: string };
};

// Validation schemas for simple chat
const simpleChatValidation = v.object({
  chatId: v.optional(v.string()),
  userMessage: v.string(),
});
export type SimpleChatInput = v.InferOutput<typeof simpleChatValidation>;

// Validation schemas for chat groups
const createChatGroupValidation = v.object({
  name: v.string(),
  meta: v.optional(v.record(v.string(), v.any())),
});

const updateChatGroupValidation = v.object({
  name: v.optional(v.string()),
  meta: v.optional(v.record(v.string(), v.any())),
});

// Add these validation schemas near the top with other schemas
const addUsersToGroupValidation = v.object({
  userIds: v.array(v.string()),
});

const removeUsersFromGroupValidation = v.object({
  userIds: v.array(v.string()),
});

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
        const parsedBody = v.parse(chatWithTemplateValidation, body);
        const organisationId = c.req.param("organisationId");

        if (parsedBody.chatSessionGroupId) {
          const groups = await getChatSessionGroupsByUser(
            organisationId,
            usersId
          );
          const isMember = groups.some(
            (g) => g.id === parsedBody.chatSessionGroupId
          );
          if (!isMember) {
            throw new HTTPException(403, {
              message: "User is not a member of the specified chat group",
            });
          }
        }

        const r = await useTemplateChat({
          ...parsedBody,
          userId: usersId,
          meta: {
            organisationId,
            userId: usersId,
            chatSessionGroupId: parsedBody.chatSessionGroupId,
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
    async (c) => {
      const usersId = c.get("usersId");
      const organisationId = c.req.param("organisationId");
      const startFrom = c.req.query("startFrom") ?? "2000-01-01";
      const r = await chatStoreInDb.getHistoryByUserId(usersId, startFrom, {
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
      const r = await chatStoreInDb.get(id);
      if (!r) {
        throw new HTTPException(404, {
          message: `Chat session ${id} not found`,
        });
      }
      return c.json({
        chatId: id,
        name: r.name,
        history: r.fullHistory,
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
      await chatStoreInDb.drop(id);
      return c.json(RESPONSES.SUCCESS);
    }
  );

  /**
   * Chat History for a chat-session-group
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat/history/group/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      const id = c.req.param("id");
      const organisationId = c.req.param("organisationId");
      const usersId = c.get("usersId");
      const r = await queryChatSessions(organisationId, usersId, {
        chatSessionGroupId: id,
      });
      return c.json(r);
    }
  );

  /**
   * Create a new Chat Group and assign the creating user to it.
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat-groups",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const usersId = c.get("usersId");
        const organisationId = c.req.param("organisationId");

        const parsedBody = v.parse(createChatGroupValidation, body);

        // Create the chat group
        const chatGroup = await createChatSessionGroup({
          name: parsedBody.name,
          meta: parsedBody.meta,
          organisationId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Assign the creating user to the chat group
        await addUserToChatSessionGroup(chatGroup.id, usersId);

        return c.json(chatGroup);
      } catch (e) {
        throw new HTTPException(400, {
          message: e + "",
        });
      }
    }
  );

  /**
   * Get all Chat Groups the current user is a member of.
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat-groups",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      const usersId = c.get("usersId");
      const organisationId = c.req.param("organisationId");
      const chatGroups = await getChatSessionGroupsByUser(
        organisationId,
        usersId
      );
      return c.json(chatGroups);
    }
  );

  /**
   * Update a Chat Group. Only members can update.
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat-groups/:groupId",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const usersId = c.get("usersId");
        const organisationId = c.req.param("organisationId");
        const groupId = c.req.param("groupId");
        const parsedBody = v.parse(updateChatGroupValidation, body);

        const updatedGroup = await updateChatSessionGroup(
          groupId,
          organisationId,
          parsedBody,
          usersId
        );

        if (!updatedGroup) {
          throw new HTTPException(404, {
            message: "Chat group not found or access denied.",
          });
        }

        return c.json(updatedGroup);
      } catch (e) {
        throw new HTTPException(400, {
          message: e + "",
        });
      }
    }
  );

  /**
   * Delete a Chat Group. Only members can delete.
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat-groups/:groupId",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      const usersId = c.get("usersId");
      const organisationId = c.req.param("organisationId");
      const groupId = c.req.param("groupId");

      try {
        await deleteChatSessionGroup(groupId, organisationId, usersId);
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, {
          message: e + "",
        });
      }
    }
  );

  /**
   * Add users to a Chat Group. Only members can add other users.
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/chat-groups/:groupId/users",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const usersId = c.get("usersId");
        const organisationId = c.req.param("organisationId");
        const groupId = c.req.param("groupId");

        const parsedBody = v.parse(addUsersToGroupValidation, body);

        // Verify the current user is a member of the group
        const groups = await getChatSessionGroupsByUser(
          organisationId,
          usersId
        );
        const isMember = groups.some((g) => g.id === groupId);
        if (!isMember) {
          throw new HTTPException(403, {
            message: "Only group members can add users",
          });
        }

        const result = await addUsersToChatSessionGroup(
          groupId,
          parsedBody.userIds
        );
        return c.json(result);
      } catch (e) {
        throw new HTTPException(400, {
          message: e + "",
        });
      }
    }
  );

  /**
   * Remove users from a Chat Group. Only members can remove other users.
   */
  app.delete(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/chat-groups/:groupId/users",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const usersId = c.get("usersId");
        const organisationId = c.req.param("organisationId");
        const groupId = c.req.param("groupId");

        const parsedBody = v.parse(removeUsersFromGroupValidation, body);

        // Verify the current user is a member of the group
        const groups = await getChatSessionGroupsByUser(
          organisationId,
          usersId
        );
        const isMember = groups.some((g) => g.id === groupId);
        if (!isMember) {
          throw new HTTPException(403, {
            message: "Only group members can remove users",
          });
        }

        await removeUsersFromChatSessionGroup(groupId, parsedBody.userIds);
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, {
          message: e + "",
        });
      }
    }
  );
}
