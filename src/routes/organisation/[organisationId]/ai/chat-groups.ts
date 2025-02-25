/**
 * Routes to manage Chat Groups
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import { RESPONSES } from "../../../../lib/responses";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";
import { queryChatSessions } from "../../../../lib/ai/chat-groups";
import {
  createChatSessionGroup,
  getChatSessionGroupsByUser,
  updateChatSessionGroup,
  deleteChatSessionGroup,
  addUserToChatSessionGroup,
  addUsersToChatSessionGroup,
  removeUsersFromChatSessionGroup,
} from "../../../../lib/ai/chat-groups";
import {
  chatSessionGroupAssignmentsSelectSchema,
  chatSessionGroupsInsertSchema,
  chatSessionGroupsSelectSchema,
  chatSessionGroupsUpdateSchema,
  chatSessionsSelectSchema,
} from "../../../../dbSchema";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";

// Add these validation schemas near the top with other schemas
const addUsersToGroupValidation = v.object({
  userIds: v.array(v.string()),
});

const removeUsersFromGroupValidation = v.object({
  userIds: v.array(v.string()),
});

export default function defineChatGroupRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Chat History for a chat-session-group
   */
  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/chat-groups/:groupId/history",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/chat-groups/:groupId/history",
      tags: ["chat-groups"],
      summary: "Get chat history for a chat group",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(chatSessionsSelectSchema)),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        groupId: v.string(),
      })
    ),
    async (c) => {
      const { organisationId, groupId } = c.req.valid("param");
      const usersId = c.get("usersId");
      const history = await queryChatSessions(organisationId, usersId, {
        chatSessionGroupId: groupId,
      });
      return c.json(history);
    }
  );

  /**
   * Create a new Chat Group and assign the creating user to it.
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/chat-groups",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/chat-groups",
      tags: ["chat-groups"],
      summary: "Create a new chat group",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(chatSessionGroupsSelectSchema),
            },
          },
        },
      },
    }),
    validator("json", chatSessionGroupsInsertSchema),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const usersId = c.get("usersId");
        const { organisationId } = c.req.valid("param");
        const body = c.req.valid("json");

        // Create the chat group
        const chatGroup = await createChatSessionGroup({
          ...body,
          organisationId,
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
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/chat-groups",
      tags: ["chat-groups"],
      summary: "Get all chat groups for the current user",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(chatSessionGroupsSelectSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    validator("query", v.object({ workspaceId: v.optional(v.string()) })),
    async (c) => {
      const usersId = c.get("usersId");
      const { organisationId } = c.req.valid("param");
      const { workspaceId } = c.req.valid("query");
      const chatGroups = await getChatSessionGroupsByUser(
        organisationId,
        usersId,
        {
          workspaceId,
        }
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
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/chat-groups/:groupId",
      tags: ["chat-groups"],
      summary: "Update a chat group",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(chatSessionGroupsSelectSchema),
            },
          },
        },
      },
    }),
    validator("json", chatSessionGroupsUpdateSchema),
    validator(
      "param",
      v.object({ organisationId: v.string(), groupId: v.string() })
    ),
    async (c) => {
      try {
        const usersId = c.get("usersId");
        const { organisationId, groupId } = c.req.valid("param");
        const body = c.req.valid("json");

        const updatedGroup = await updateChatSessionGroup(
          groupId,
          organisationId,
          body,
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
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/chat-groups/:groupId",
      tags: ["chat-groups"],
      summary: "Delete a chat group",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), groupId: v.string() })
    ),
    async (c) => {
      const usersId = c.get("usersId");
      const { organisationId, groupId } = c.req.valid("param");

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
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/chat-groups/:groupId/users",
      tags: ["chat-groups"],
      summary: "Add users to a chat group",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.array(chatSessionGroupAssignmentsSelectSchema)
              ),
            },
          },
        },
      },
    }),
    validator("json", addUsersToGroupValidation),
    validator(
      "param",
      v.object({ organisationId: v.string(), groupId: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, groupId } = c.req.valid("param");
        const body = c.req.valid("json");
        const usersId = c.get("usersId");

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
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/chat-groups/:groupId/users",
      tags: ["chat-groups"],
      summary: "Remove users from a chat group",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator("json", removeUsersFromGroupValidation),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        groupId: v.string(),
        userIds: v.string(),
      })
    ),
    async (c) => {
      try {
        const { organisationId, groupId, userIds } = c.req.valid("param");
        const usersId = c.get("usersId");
        const userIdsArr = userIds.split(",");

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

        await removeUsersFromChatSessionGroup(groupId, userIdsArr);
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, {
          message: e + "",
        });
      }
    }
  );
}
