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
import {
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  checkTeamMemberRole,
  getTeamsByUser,
  getTeamMembers,
} from "../../../../lib/usermanagement/teams";

const BASE_PATH = ""; // "/usermanagement";

export default function defineTeamRoutes(
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
        // assign the user to the team
        await addTeamMember(team.id, c.get("usersId"), "admin");
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
        const teams = await getTeamsByUser(
          c.get("usersId"),
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
   * Get all members of a team
   */
  app.get(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/teams/:id/members",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      const userId = c.get("usersId");
      const organisationId = c.req.param("organisationId");
      const id = c.req.param("id");
      const members = await getTeamMembers(userId, organisationId, id);
      return c.json(members);
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
   * Change the role of a member
   */
  app.put(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/teams/:teamId/members/:destinationUserId",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      const userId = c.get("usersId");
      const { role } = await c.req.json();
      await checkTeamMemberRole(c.req.param("teamId"), userId, "admin");
      const member = await updateTeamMemberRole(
        c.req.param("teamId"),
        c.req.param("destinationUserId"),
        role
      );
      return c.json(member);
    }
  );

  /**
   * Remove a member from a team
   */
  app.delete(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/teams/:teamId/members/:usedestinationUserIdrId",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        await checkTeamMemberRole(c.req.param("teamId"), userId, "admin");
        await removeTeamMember(
          c.req.param("teamId"),
          c.req.param("destinationUserId")
        );
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error removing team member: " + err,
        });
      }
    }
  );
}
