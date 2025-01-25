import type { FastAppHono } from "../../../../types";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import { authAndSetUsersInfo } from "../../../../lib/utils/hono-middlewares";
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
  // ---
  // Team routes
  // ---

  app.post(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/teams",
    authAndSetUsersInfo,
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

  app.get(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/teams",
    authAndSetUsersInfo,
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

  app.get(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/teams/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      const team = await getTeam(c.req.param("id"));
      return c.json(team);
    }
  );

  app.put(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/teams/:id",
    authAndSetUsersInfo,
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

  app.delete(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/teams/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      await deleteTeam(c.req.param("id"));
      return c.json({ success: true });
    }
  );

  // ---
  // Team member management
  // ---

  app.post(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/teams/:teamId/members",
    authAndSetUsersInfo,
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

  app.delete(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/teams/:teamId/members/:userId",
    authAndSetUsersInfo,
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
