/**
 * Routes to manage workspaces of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import { HTTPException } from "../../../../types";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";
import {
  createWorkspace,
  getAllUsersWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  addToWorkspace,
  dropFromWorkspace,
  getChildWorkspaces,
  getWorkspaceOrigin,
} from "../../../../lib/workspaces";
import {
  getWorkspaceUsers,
  addUsersToWorkspace,
  removeUsersFromWorkspace,
  getSharedWorkspaces,
} from "../../../../lib/workspaces/users";
import type { FastAppHono } from "../../../../types";
import {
  WorkspaceRelationsSchema,
  workspacesInsertSchema,
  workspacesSelectSchema,
  workspacesUpdateSchema,
} from "../../../../lib/db/schema/workspaces";
import * as v from "valibot";
import { validateOrganisationId } from "../../../../lib/utils/doublecheck-organisation";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { RESPONSES } from "../../../../lib/responses";

/**
 * Define the workspace management routes
 */
export default function defineWorkspaceRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Get all workspaces for user
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/workspaces",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/workspaces",
      tags: ["workspaces"],
      summary: "Get all workspaces for user",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(workspacesSelectSchema)),
            },
          },
        },
      },
    }),
    validator("query", v.object({ parentId: v.optional(v.string()) })),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { parentId } = c.req.valid("query");
        const { organisationId } = c.req.valid("param");

        // Convert "null" string to actual null value
        const parentIdFilter = parentId === "null" ? null : parentId;
        const workspaces = await getAllUsersWorkspaces(userId, parentIdFilter);
        return c.json(workspaces);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to get workspaces",
        });
      }
    }
  );

  /**
   * Get all shared workspaces for user (where user is a member but not owner)
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/workspaces/shared",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/workspaces/shared",
      tags: ["workspaces"],
      summary: "Get all shared workspaces where user is a member but not owner",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(workspacesSelectSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { organisationId } = c.req.valid("param");
        const workspaces = await getSharedWorkspaces(userId);
        return c.json(workspaces);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to get shared workspaces",
        });
      }
    }
  );

  /**
   * Get single workspace by ID
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/workspaces/:workspaceId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/workspaces/:workspaceId",
      tags: ["workspaces"],
      summary: "Get single workspace by ID",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(workspacesSelectSchema),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), workspaceId: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, workspaceId } = c.req.valid("param");
        const userId = c.get("usersId");
        const workspace = await getWorkspaceById(workspaceId, userId);
        return c.json(workspace);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to get workspace",
        });
      }
    }
  );

  /**
   * Create new workspace in a specific organisation
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/workspaces",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/workspaces",
      tags: ["workspaces"],
      summary: "Create new workspace in a specific organisation",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(workspacesSelectSchema),
            },
          },
        },
      },
    }),
    validator("json", workspacesInsertSchema),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const body = c.req.valid("json");
        const userId = c.get("usersId");
        const { organisationId } = c.req.valid("param");
        validateOrganisationId(body, organisationId);

        const workspace = await createWorkspace(userId, { ...body, userId }); // ensure the userId to be own
        return c.json(workspace);
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );

  /**
   * Update a workspace in a specific organisation
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/workspaces/:workspaceId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/workspaces/:workspaceId",
      tags: ["workspaces"],
      summary: "Update a workspace in a specific organisation",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(workspacesSelectSchema),
            },
          },
        },
      },
    }),
    validator("json", workspacesUpdateSchema),
    validator(
      "param",
      v.object({ organisationId: v.string(), workspaceId: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, workspaceId } = c.req.valid("param");
        const userId = c.get("usersId");
        const body = c.req.valid("json");
        validateOrganisationId(body, organisationId);

        const updated = await updateWorkspace(workspaceId, body, userId);
        return c.json(updated);
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );

  /**
   * Delete a workspace
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/workspaces/:workspaceId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/workspaces/:workspaceId",
      tags: ["workspaces"],
      summary: "Delete a workspace",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), workspaceId: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, workspaceId } = c.req.valid("param");
        const userId = c.get("usersId");
        await deleteWorkspace(workspaceId, userId);
        return c.json(RESPONSES.SUCCESS);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to delete workspace",
        });
      }
    }
  );

  /**
   * Add relations to a workspace
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/workspaces/:workspaceId/relations",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/workspaces/:workspaceId/relations",
      tags: ["workspaces"],
      summary: "Add relations to a workspace",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator("json", WorkspaceRelationsSchema),
    validator(
      "param",
      v.object({ organisationId: v.string(), workspaceId: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, workspaceId } = c.req.valid("param");
        const userId = c.get("usersId");
        const parsed = c.req.valid("json");

        await addToWorkspace(workspaceId, parsed, userId);
        return c.json(RESPONSES.SUCCESS);
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );

  /**
   * Remove relations from a workspace
   */
  app.delete(
    API_BASE_PATH +
      "/organisation/:organisationId/workspaces/:workspaceId/relations",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/workspaces/:workspaceId/relations",
      tags: ["workspaces"],
      summary: "Remove relations from a workspace",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator("json", WorkspaceRelationsSchema),
    validator(
      "param",
      v.object({ organisationId: v.string(), workspaceId: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, workspaceId } = c.req.valid("param");
        const userId = c.get("usersId");
        const relations = c.req.valid("json");

        await dropFromWorkspace(workspaceId, relations, userId);
        return c.json(RESPONSES.SUCCESS);
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );

  /**
   * Get all members of a workspace
   */
  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/workspaces/:workspaceId/members",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/workspaces/:workspaceId/members",
      tags: ["workspaces"],
      summary: "Get all members of a workspace",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.array(
                  v.object({
                    userId: v.string(),
                    userEmail: v.string(),
                  })
                )
              ),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), workspaceId: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, workspaceId } = c.req.valid("param");
        const userId = c.get("usersId");
        const members = await getWorkspaceUsers(workspaceId, userId);
        return c.json(members);
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );

  /**
   * Add members to a workspace
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/workspaces/:workspaceId/members",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/workspaces/:workspaceId/members",
      tags: ["workspaces"],
      summary: "Add members to a workspace",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator("json", v.object({ userIds: v.array(v.string()) })),
    validator(
      "param",
      v.object({ organisationId: v.string(), workspaceId: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, workspaceId } = c.req.valid("param");
        const userId = c.get("usersId");
        const { userIds } = c.req.valid("json");

        await addUsersToWorkspace(workspaceId, userIds, userId);
        return c.json(RESPONSES.SUCCESS);
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );

  /**
   * Remove members from a workspace
   */
  app.delete(
    API_BASE_PATH +
      "/organisation/:organisationId/workspaces/:workspaceId/members/:memberId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/workspaces/:workspaceId/members/:memberId",
      tags: ["workspaces"],
      summary: "Remove members from a workspace",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        workspaceId: v.string(),
        memberId: v.string(),
      })
    ),
    async (c) => {
      try {
        const { organisationId, workspaceId, memberId } = c.req.valid("param");
        const userId = c.get("usersId");

        await removeUsersFromWorkspace(workspaceId, [memberId], userId);
        return c.json(RESPONSES.SUCCESS);
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );

  /**
   * Get all child workspaces for a parent workspace
   */
  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/workspaces/:workspaceId/children",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/workspaces/:workspaceId/children",
      tags: ["workspaces"],
      summary: "Get all child workspaces for a parent workspace",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(workspacesSelectSchema)),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        workspaceId: v.string(),
      })
    ),
    async (c) => {
      try {
        const { organisationId, workspaceId } = c.req.valid("param");
        const userId = c.get("usersId");

        const childWorkspaces = await getChildWorkspaces(workspaceId, userId);
        return c.json(childWorkspaces);
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );

  /**
   * Get all parent workspaces for a given workspace ID
   */
  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/workspaces/:workspaceId/origin",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/workspaces/:workspaceId/origin",
      tags: ["workspaces"],
      summary: "Get all parent workspaces for a given workspace ID",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  list: v.array(
                    v.object({
                      id: v.string(),
                      name: v.string(),
                      parentId: v.optional(v.nullable(v.string())),
                    })
                  ),
                })
              ),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        workspaceId: v.string(),
      })
    ),
    async (c) => {
      try {
        const { organisationId, workspaceId } = c.req.valid("param");
        const userId = c.get("usersId");

        const originWorkspaces = await getWorkspaceOrigin(workspaceId, userId);
        return c.json({
          list: originWorkspaces,
        });
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );
}
