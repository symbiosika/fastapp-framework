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
} from "../../../../lib/workspaces";
import type { FastAppHono } from "../../../../types";
import {
  WorkspaceRelationsSchema,
  workspacesInsertSchema,
  workspacesUpdateSchema,
  type WorkspaceRelations,
} from "../../../../lib/db/schema/workspaces";
import * as v from "valibot";
import { validateOrganisationId } from "../../../../lib/utils/doublecheck-organisation";

/**
 * Define the workspace management routes
 */
export default function defineWorkspaceRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  // Get all workspaces for user
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/workspaces",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const userId = c.get("usersId");
        const workspaces = await getAllUsersWorkspaces(userId);
        return c.json(workspaces);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to get workspaces",
        });
      }
    }
  );

  // Get single workspace by ID
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/workspaces/:workspaceId",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const workspaceId = c.req.param("workspaceId");
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

  // Create new workspace in a specific organisation
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/workspaces",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const userId = c.get("usersId");
        const organisationId = c.req.param("organisationId");
        validateOrganisationId(body, organisationId);

        const parsed = v.parse(workspacesInsertSchema, body);
        const workspace = await createWorkspace(userId, parsed);
        return c.json(workspace);
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );

  // Update a workspace in a specific organisation
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/workspaces/:workspaceId",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const body = await c.req.json();
        const workspaceId = c.req.param("workspaceId");
        const userId = c.get("usersId");
        const organisationId = c.req.param("organisationId");
        validateOrganisationId(body, organisationId);

        const parsed = v.parse(workspacesUpdateSchema, body);
        const updated = await updateWorkspace(workspaceId, parsed, userId);
        return c.json(updated);
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );

  // Delete a workspace
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/workspaces/:workspaceId",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const workspaceId = c.req.param("workspaceId");
        const userId = c.get("usersId");
        await deleteWorkspace(workspaceId, userId);
        return c.json({ message: "Workspace deleted" });
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to delete workspace",
        });
      }
    }
  );

  // Add relations to a workspace
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/workspaces/:workspaceId/relations",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const workspaceId = c.req.param("workspaceId");
        const userId = c.get("usersId");
        const relations = await c.req.json();
        const parsed = v.parse(WorkspaceRelationsSchema, relations);

        await addToWorkspace(workspaceId, parsed, userId);
        return c.json({ message: "Relations added to workspace" });
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );

  // Remove relations from a workspace
  app.delete(
    API_BASE_PATH +
      "/organisation/:organisationId/workspaces/:workspaceId/relations",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const workspaceId = c.req.param("workspaceId");
        const userId = c.get("usersId");
        const relations = await c.req.json();
        const parsed = v.parse(WorkspaceRelationsSchema, relations);

        await dropFromWorkspace(workspaceId, parsed, userId);
        return c.json({ message: "Relations removed from workspace" });
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );
}
