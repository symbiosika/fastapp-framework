/**
 * Routes to manage the teams of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../types";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";
import { getTeamsAndMembersByOrganisation } from "../../../../lib/usermanagement/oganisations";
import {
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from "../../../../lib/usermanagement/teams";

const BASE_PATH = "/usermanagement";

export function defineUserManagementRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Create a new team
   */
  app.post(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/teams",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const team = await createTeam(data);
        return c.json(team);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating team: " + err,
        });
      }
    }
  );

  /**
   * Get all teams of an organisation
   */
  app.get(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/teams",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        const teams = await getTeamsAndMembersByOrganisation(
          c.req.param("organisationId")
        );
        return c.json(teams);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting teams: " + err,
        });
      }
    }
  );

  /**
   * Get a team by id
   */
  app.get(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/teams/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      const team = await getTeam(c.req.param("id"));
      return c.json(team);
    }
  );

  /**
   * Update a team
   */
  app.put(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/teams/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const team = await updateTeam(c.req.param("id"), data);
        return c.json(team);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error updating team: " + err,
        });
      }
    }
  );

  /**
   * Delete a team
   */
  app.delete(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/teams/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      await deleteTeam(c.req.param("id"));
      return c.json({ success: true });
    }
  );

  /**
   * Add a member to a team
   */
  app.post(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/teams/:teamId/members",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        const { userId, role } = await c.req.json();
        const member = await addTeamMember(c.req.param("teamId"), userId, role);
        return c.json(member);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error adding team member: " + err,
        });
      }
    }
  );

  /**
   * Remove a member from a team
   */
  app.delete(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/teams/:teamId/members/:userId",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        await removeTeamMember(c.req.param("teamId"), c.req.param("userId"));
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error removing team member: " + err,
        });
      }
    }
  );
}
