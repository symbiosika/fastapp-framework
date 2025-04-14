/**
 * Routes to manage the permission groups of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 * These routes are NOT used by the frontend in normal applications!
 */

import type { FastAppHono } from "../../../../types";
import { HTTPException } from "hono/http-exception";
import { authAndSetUsersInfo } from "../../../../lib/utils/hono-middlewares";
import {
  createPermissionGroup,
  getPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
  getPermissionGroupsByOrganisation,
  createPathPermission,
  getPathPermission,
  updatePathPermission,
  assignPermissionToGroup,
  deletePathPermission,
  removePermissionFromGroup,
} from "../../../../lib/usermanagement/permissions";
import { resolver, validator } from "hono-openapi/valibot";
import {
  pathPermissionsInsertSchema,
  pathPermissionsSelectSchema,
  pathPermissionsUpdateSchema,
  userPermissionGroupsInsertSchema,
  userPermissionGroupsSelectSchema,
  userPermissionGroupsUpdateSchema,
} from "../../../../dbSchema";
import * as v from "valibot";
import { describeRoute } from "hono-openapi";
import { RESPONSES } from "../../../../lib/responses";
import { validateScope } from "../../../../lib/utils/validate-scope";

export default function definePermissionGroupRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Create a new permission group
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/permission-groups",
    authAndSetUsersInfo,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/permission-groups",
      tags: ["permission-groups"],
      summary: "Create a new permission group",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(userPermissionGroupsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("permissions:write"),
    validator("json", userPermissionGroupsInsertSchema),
    async (c) => {
      try {
        const data = c.req.valid("json");
        const group = await createPermissionGroup(data);
        return c.json(group);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating permission group: " + err,
        });
      }
    }
  );

  /**
   * Get all permission groups of an organisation
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/permission-groups",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/permission-groups",
      tags: ["permission-groups"],
      summary: "Get all permission groups of an organisation",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(userPermissionGroupsSelectSchema)),
            },
          },
        },
      },
    }),
    validateScope("permissions:read"),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const groups = await getPermissionGroupsByOrganisation(organisationId);
        return c.json(groups);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting permission groups: " + err,
        });
      }
    }
  );

  /**
   * Get a single permission group
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/permission-groups/:id",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/permission-groups/:id",
      tags: ["permission-groups"],
      summary: "Get a single permission group",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(userPermissionGroupsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("permissions:read"),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        const group = await getPermissionGroup(id);
        return c.json(group);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting permission group: " + err,
        });
      }
    }
  );

  /**
   * Update a permission group
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/permission-groups/:id",
    authAndSetUsersInfo,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/permission-groups/:id",
      tags: ["permission-groups"],
      summary: "Update a permission group",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(userPermissionGroupsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("permissions:write"),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    validator("json", userPermissionGroupsUpdateSchema),
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        const data = c.req.valid("json");
        const group = await updatePermissionGroup(id, data);
        return c.json(group);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error updating permission group: " + err,
        });
      }
    }
  );

  /**
   * Delete a permission group
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/permission-groups/:id",
    authAndSetUsersInfo,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/permission-groups/:id",
      tags: ["permission-groups"],
      summary: "Delete a permission group",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validateScope("permissions:write"),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        await deletePermissionGroup(id);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error deleting permission group: " + err,
        });
      }
    }
  );

  /**
   * Assign a permission to a permission group
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/permission-groups/:groupId/permissions/:permissionId",
    authAndSetUsersInfo,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/permission-groups/:groupId/permissions/:permissionId",
      tags: ["permission-groups"],
      summary: "Assign a permission to a permission group",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  groupId: v.string(),
                  permissionId: v.string(),
                })
              ),
            },
          },
        },
      },
    }),
    validateScope("permissions:write"),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        groupId: v.string(),
        permissionId: v.string(),
      })
    ),
    async (c) => {
      try {
        const { organisationId, groupId, permissionId } = c.req.valid("param");
        const result = await assignPermissionToGroup(groupId, permissionId);
        return c.json(result);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error assigning permission to group: " + err,
        });
      }
    }
  );

  /**
   * Remove a permission from a permission group
   */
  app.delete(
    API_BASE_PATH +
      "/organisation/:organisationId/permission-groups/:groupId/permissions/:permissionId",
    authAndSetUsersInfo,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/permission-groups/:groupId/permissions/:permissionId",
      tags: ["permission-groups"],
      summary: "Remove a permission from a permission group",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validateScope("permissions:write"),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        groupId: v.string(),
        permissionId: v.string(),
      })
    ),
    async (c) => {
      try {
        const { organisationId, groupId, permissionId } = c.req.valid("param");
        await removePermissionFromGroup(groupId, permissionId);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error removing permission from group: " + err,
        });
      }
    }
  );

  /**
   * Create a new path permission
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/path-permissions",
    authAndSetUsersInfo,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/path-permissions",
      tags: ["permission-groups"],
      summary: "Create a new path permission",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(pathPermissionsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("permissions:write"),
    validator("json", pathPermissionsInsertSchema),
    async (c) => {
      try {
        const data = c.req.valid("json");
        const permission = await createPathPermission(data);
        return c.json(permission);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating path permission: " + err,
        });
      }
    }
  );

  /**
   * Get a single path permission
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/path-permissions/:id",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/path-permissions/:id",
      tags: ["permission-groups"],
      summary: "Get a single path permission",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(pathPermissionsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("permissions:read"),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        const permission = await getPathPermission(id);
        return c.json(permission);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting path permission: " + err,
        });
      }
    }
  );

  /**
   * Update a path permission
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/path-permissions/:id",
    authAndSetUsersInfo,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/path-permissions/:id",
      tags: ["permission-groups"],
      summary: "Update a path permission",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(pathPermissionsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("permissions:write"),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    validator("json", pathPermissionsUpdateSchema),
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        const data = c.req.valid("json");
        const permission = await updatePathPermission(id, data);
        return c.json(permission);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error updating path permission: " + err,
        });
      }
    }
  );

  /**
   * Delete a path permission
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/path-permissions/:id",
    authAndSetUsersInfo,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/path-permissions/:id",
      tags: ["permission-groups"],
      summary: "Delete a path permission",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validateScope("permissions:write"),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        await deletePathPermission(id);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error deleting path permission: " + err,
        });
      }
    }
  );
}
