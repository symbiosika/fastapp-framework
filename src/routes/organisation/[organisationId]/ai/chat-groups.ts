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
  chatSessionGroupsInsertSchema,
  chatSessionGroupsUpdateSchema,
} from "../../../../dbSchema";

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
    async (c) => {
      const id = c.req.param("groupId");
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

        const parsedBody = v.parse(chatSessionGroupsInsertSchema, {
          ...body,
          organisationId,
        });

        // Create the chat group
        const chatGroup = await createChatSessionGroup(parsedBody);

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
        const parsedBody = v.parse(chatSessionGroupsUpdateSchema, body);

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
