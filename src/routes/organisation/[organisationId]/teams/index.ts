/**
 * Routes to manage the teams of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../types";
import { HTTPException } from "hono/http-exception";
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
import { teamsInsertSchema, teamsSelectSchema } from "../../../../dbSchema";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from "valibot";
import { RESPONSES } from "../../../../lib/responses";
import { MiddlewareHandler } from "hono";

/**
 * Middleware to check if user is a member of the organisation
 */
export const isTeamMember: MiddlewareHandler = async (c, next) => {
  const userId = c.get("usersId");
  const teamId = c.req.param("teamId")!;

  try {
    await checkTeamMemberRole(teamId, userId, ["admin", "member"]);
    await next();
  } catch (err) {
    throw new HTTPException(403, {
      message: "User is not a member of this team",
    });
  }
};

/**
 * Middleware to check if user is an admin of the team
 */
export const isTeamAdmin: MiddlewareHandler = async (c, next) => {
  const userId = c.get("usersId");
  const teamId = c.req.param("teamId")!;

  try {
    await checkTeamMemberRole(teamId, userId, ["admin"]);
    await next();
  } catch (err) {
    throw new HTTPException(403, {
      message: "User is not an admin of this team",
    });
  }
};

export default function defineTeamRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Create a new team
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/teams",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/teams",
      tags: ["teams"],
      summary: "Create a new team",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(teamsSelectSchema),
            },
          },
        },
      },
    }),
    validator("json", teamsInsertSchema),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const data = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
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
    API_BASE_PATH + "/organisation/:organisationId/teams",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/teams",
      tags: ["teams"],
      summary: "Get all teams of an organisation",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(teamsSelectSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const teams = await getTeamsByUser(c.get("usersId"), organisationId);
        return c.json(teams);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting teams: " + err,
        });
      }
    }
  );

  /**
   * Get a team by teamId
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/teams/:teamId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/teams/:teamId",
      tags: ["teams"],
      summary: "Get a team by its id",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(teamsSelectSchema),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), teamId: v.string() })
    ),
    isTeamMember, // check if user is a member of the organisation
    async (c) => {
      const { organisationId, teamId } = c.req.valid("param");
      const team = await getTeam(teamId);
      return c.json(team);
    }
  );

  /**
   * Update a team
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/teams/:teamId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/teams/:teamId",
      tags: ["teams"],
      summary: "Update a team",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(teamsSelectSchema),
            },
          },
        },
      },
    }),
    validator("json", teamsInsertSchema),
    validator(
      "param",
      v.object({ organisationId: v.string(), teamId: v.string() })
    ),
    isTeamAdmin, // check if user is an admin of the team
    async (c) => {
      try {
        const { organisationId, teamId } = c.req.valid("param");
        const data = c.req.valid("json");
        const team = await updateTeam(teamId, data);
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
    API_BASE_PATH + "/organisation/:organisationId/teams/:teamId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/teams/:teamId",
      tags: ["teams"],
      summary: "Delete a team",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), teamId: v.string() })
    ),
    isTeamAdmin, // check if user is an admin of the team
    async (c) => {
      try {
        const { organisationId, teamId } = c.req.valid("param");
        await deleteTeam(teamId);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error deleting team: " + err,
        });
      }
    }
  );

  /**
   * Get all members of a team
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/teams/:teamId/members",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/teams/:teamId/members",
      tags: ["teams"],
      summary: "Get all members of a team",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.array(
                  v.object({
                    teamId: v.string(),
                    userId: v.string(),
                    userEmail: v.string(),
                    role: v.union([v.literal("admin"), v.literal("member")]),
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
      v.object({ organisationId: v.string(), teamId: v.string() })
    ),
    isTeamMember, // check if user is a member of the team
    async (c) => {
      try {
        const { organisationId, teamId } = c.req.valid("param");
        const members = await getTeamMembers(
          c.get("usersId"),
          organisationId,
          teamId
        );
        return c.json(members);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting team members: " + err,
        });
      }
    }
  );

  /**
   * Add a member to a team
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/teams/:teamId/members",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/teams/:teamId/members",
      tags: ["teams"],
      summary: "Add a member to a team",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  userId: v.string(),
                  teamId: v.string(),
                  role: v.union([v.literal("admin"), v.literal("member")]),
                  joinedAt: v.string(),
                })
              ),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        userId: v.string(),
        role: v.union([v.literal("admin"), v.literal("member")]),
      })
    ),
    validator(
      "param",
      v.object({ organisationId: v.string(), teamId: v.string() })
    ),
    isTeamAdmin, // check if user is an admin of the team
    async (c) => {
      try {
        const { userId, role } = await c.req.valid("json");
        const { organisationId, teamId } = c.req.valid("param");
        const member = await addTeamMember(teamId, userId, role);
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
      "/organisation/:organisationId/teams/:teamId/members/:destinationUserId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/teams/:teamId/members/:destinationUserId",
      tags: ["teams"],
      summary: "Change the role of a member",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  userId: v.string(),
                  teamId: v.string(),
                  role: v.union([v.literal("admin"), v.literal("member")]),
                  joinedAt: v.string(),
                })
              ),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        role: v.union([v.literal("admin"), v.literal("member")]),
      })
    ),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        teamId: v.string(),
        destinationUserId: v.string(),
      })
    ),
    isTeamAdmin, // check if user is an admin of the team
    async (c) => {
      const userId = c.get("usersId");
      const { role } = c.req.valid("json");
      const { organisationId, teamId, destinationUserId } =
        c.req.valid("param");

      const member = await updateTeamMemberRole(
        teamId,
        destinationUserId,
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
      "/organisation/:organisationId/teams/:teamId/members/:destinationUserId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/teams/:teamId/members/:destinationUserId",
      tags: ["teams"],
      summary: "Remove a member from a team",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        teamId: v.string(),
        destinationUserId: v.string(),
      })
    ),
    isTeamAdmin, // check if user is an admin of the team
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { organisationId, teamId, destinationUserId } =
          c.req.valid("param");

        await removeTeamMember(teamId, destinationUserId);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error removing team member: " + err,
        });
      }
    }
  );
}
