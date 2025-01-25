/**
 * Routes to manage the permission groups of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 * These routes are NOT used by the frontend in normal applications!
 */

import type { FastAppHono } from "../../../../types";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
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

const BASE_PATH = "/usermanagement";

export function defineUserManagementRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Create a new permission group
   */
  app.post(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/permission-groups",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const data = await c.req.json();
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
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/permission-groups",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const groups = await getPermissionGroupsByOrganisation(
          c.req.param("organisationId")
        );
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
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/permission-groups/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      const group = await getPermissionGroup(c.req.param("id"));
      return c.json(group);
    }
  );

  /**
   * Update a permission group
   */
  app.put(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/permission-groups/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const group = await updatePermissionGroup(c.req.param("id"), data);
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
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/permission-groups/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      await deletePermissionGroup(c.req.param("id"));
      return c.json({ success: true });
    }
  );

  /**
   * Assign a permission to a permission group
   */
  app.post(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/permission-groups/:groupId/permissions/:permissionId",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const result = await assignPermissionToGroup(
          c.req.param("groupId"),
          c.req.param("permissionId")
        );
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
      BASE_PATH +
      "/organisation/:organisationId/permission-groups/:groupId/permissions/:permissionId",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        await removePermissionFromGroup(
          c.req.param("groupId"),
          c.req.param("permissionId")
        );
        return c.json({ success: true });
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
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/path-permissions",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const data = await c.req.json();
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
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/path-permissions/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      const permission = await getPathPermission(c.req.param("id"));
      return c.json(permission);
    }
  );

  /**
   * Update a path permission
   */
  app.put(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/path-permissions/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      const data = await c.req.json();
      const permission = await updatePathPermission(c.req.param("id"), data);
      return c.json(permission);
    }
  );

  /**
   * Delete a path permission
   */
  app.delete(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/path-permissions/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      await deletePathPermission(c.req.param("id"));
      return c.json({ success: true });
    }
  );
}
