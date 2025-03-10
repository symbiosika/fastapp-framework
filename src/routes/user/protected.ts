/**
 * Routes that a user can interact with himself.
 * These routes are secured by JWT.
 * These routes are note protected by the RegEx PermissionChecker since the scope is only the user itself.
 */

import type {
  CustomPostRegisterAction,
  CustomPreRegisterVerification,
  FastAppHono,
} from "../../types";
import { HTTPException } from "hono/http-exception";
import {
  organisationInvitationsSelectSchema,
  organisationsSelectSchema,
  usersRestrictedSelectSchema,
} from "../../lib/db/db-schema";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../lib/utils/hono-middlewares";
import { _GLOBAL_SERVER_CONFIG } from "../../store";
import {
  addOrganisationMember,
  createOrganisation,
  dropUserFromOrganisation,
  getOrganisationMemberRole,
  getUserOrganisations,
} from "../../lib/usermanagement/oganisations";
import {
  getLastOrganisation,
  setLastOrganisation,
} from "../../lib/usermanagement/oganisations";
import {
  dropUserFromTeam,
  getTeamsByUser,
} from "../../lib/usermanagement/teams";
import * as v from "valibot";
import { LocalAuth } from "../../lib/auth";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import {
  getUserByEmail,
  getUserById,
  updateUser,
} from "../../lib/usermanagement/user";
import { getUsersOrganisationInvitations } from "../../lib/usermanagement/invitations";
import { RESPONSES } from "../../lib/responses";
import {
  createApiToken,
  listApiTokensForUser,
  revokeApiToken,
} from "../../lib/auth/token-auth";
import {
  getUserProfileImage,
  upsertUserProfileImage,
} from "../../lib/usermanagement/profile-image";

/**
 * Pre-register custom verification
 */
const preRegisterCustomVerifications: CustomPreRegisterVerification[] = [];
const postRegisterActions: CustomPostRegisterAction[] = [];

/**
 * Register new verification
 */
export const registerPreRegisterCustomVerification = (
  verification: CustomPreRegisterVerification
) => {
  preRegisterCustomVerifications.push(verification);
};

/**
 * Register new post-register action
 */
export const registerPostRegisterAction = (
  action: CustomPostRegisterAction
) => {
  postRegisterActions.push(action);
};

/**
 * Define the payment routes
 */
export function defineSecuredUserRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Get the own user
   */
  app.get(
    API_BASE_PATH + "/user/me",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/user/me",
      tags: ["user"],
      summary: "Get the own user",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(usersRestrictedSelectSchema),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        // check if id is set
        const uid = c.get("usersId");
        const user = await getUserById(uid);
        return c.json(user);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting user: " + err,
        });
      }
    }
  );

  /**
   * Update the own user
   */
  app.put(
    API_BASE_PATH + "/user/me",
    authAndSetUsersInfo,
    describeRoute({
      method: "put",
      path: "/user/me",
      tags: ["user"],
      summary: "Update the own user",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(usersRestrictedSelectSchema),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        firstname: v.optional(v.string()),
        surname: v.optional(v.string()),
        image: v.optional(v.string()),
        lastOrganisationId: v.optional(v.nullable(v.string())),
      })
    ),
    async (c) => {
      try {
        // ensure to get only the allowed fields
        const { firstname, surname, image, lastOrganisationId } =
          c.req.valid("json");
        await updateUser(c.get("usersId"), {
          firstname,
          surname,
          image,
          lastOrganisationId,
        });
        const user = await getUserById(c.get("usersId"));
        return c.json(user);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error updating user: " + err,
        });
      }
    }
  );

  /**
   * Upload/Update profile image
   */
  app.post(
    API_BASE_PATH + "/user/profile-image",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/users/profile-image",
      tags: ["users"],
      summary: "Upload or update user profile image",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  success: v.boolean(),
                  message: v.string(),
                })
              ),
            },
          },
        },
      },
    }),
    validator(
      "form",
      v.object({
        file: v.any(),
      })
    ),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const form = c.req.valid("form");
        const file = form.file;

        if (!file) {
          throw new HTTPException(400, { message: "No file provided" });
        }
        await upsertUserProfileImage(userId, file);

        return c.json({
          success: true,
          message: "Profile image set successfully",
        });
      } catch (err) {
        throw new HTTPException(400, { message: err + "" });
      }
    }
  );

  /**
   * Get user profile image
   */
  app.get(
    API_BASE_PATH + "/user/profile-image",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/users/profile-image",
      tags: ["users"],
      summary: "Get user profile image",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    async (c) => {
      try {
        const userId = c.get("usersId");
        // Get the profile image from database
        const image = await getUserProfileImage(userId);
        return new Response(image.file, {
          status: 200,
          headers: {
            "Content-Type": image.contentType,
          },
        });
      } catch (err) {
        throw new HTTPException(400, { message: err + "" });
      }
    }
  );

  /**
   * A "setup" route that will give the use the possibility to setup the first organisation
   * if the user has no organisation yet.
   */
  app.post(
    API_BASE_PATH + "/user/setup",
    authAndSetUsersInfo,
    describeRoute({
      method: "post",
      path: "/user/setup",
      tags: ["user"],
      summary:
        "Setup the user's first organisation. Can throw an error if the user already has an organisation and this is not allowed",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(organisationsSelectSchema),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        organisationName: v.string(),
      })
    ),
    async (c) => {
      try {
        const userId = c.get("usersId");
        // check if user has an organisation
        // with the setup-endpoint a user can only register his first organisation if he has no organisation yet
        const orgs = await getUserOrganisations(userId);
        if (orgs.length > 0) {
          return c.json({ state: "already-setup" });
        }
        const parsed = c.req.valid("json");
        const org = await createOrganisation({
          name: parsed.organisationName,
        });
        await addOrganisationMember(org.id, userId, "admin");
        await setLastOrganisation(userId, org.id);

        return c.json(org);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating organisation: " + err,
        });
      }
    }
  );

  /**
   * Change the own password
   */
  app.put(
    API_BASE_PATH + "/user/me/password",
    authAndSetUsersInfo,
    describeRoute({
      method: "put",
      path: "/user/me/password",
      tags: ["user"],
      summary: "Change the own password",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "json",
      v.object({
        oldPassword: v.string(),
        newPassword: v.string(),
      })
    ),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { email } = await getUserById(userId);
        const { oldPassword, newPassword } = c.req.valid("json");
        await LocalAuth.changePassword(email, oldPassword, newPassword);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error changing password: " + err,
        });
      }
    }
  );

  /**
   * Get the user's organisations
   */
  app.get(
    API_BASE_PATH + "/user/organisations",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/user/organisations",
      tags: ["user", "organisations"],
      summary: "Get the user's organisations",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.array(
                  v.object({
                    organisationId: v.string(),
                    name: v.string(),
                    role: v.string(),
                  })
                )
              ),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const orgs = await getUserOrganisations(userId);
        return c.json(orgs);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting user organisations: " + err,
        });
      }
    }
  );

  /**
   * Get all pending invitations for my user
   */
  app.get(
    API_BASE_PATH + "/user/organisations/invitations",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/user/organisations/invitations",
      tags: ["invitations"],
      summary: "Get all pending invitations for my user",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(organisationInvitationsSelectSchema)),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const invitations = await getUsersOrganisationInvitations(userId);
        return c.json(invitations);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting invitations: " + err,
        });
      }
    }
  );

  /**
   * Drop the membership of a user itself from an organisation
   */
  app.delete(
    API_BASE_PATH + "/user/organisation/:organisationId/membership",
    authAndSetUsersInfo,
    describeRoute({
      method: "delete",
      path: "/user/organisation/:organisationId/membership",
      tags: ["user", "organisations"],
      summary: "Drop the membership of the user itself from an organisation",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
      })
    ),
    async (c) => {
      const userId = c.get("usersId");
      const { organisationId } = c.req.valid("param");
      try {
        await dropUserFromOrganisation(userId, organisationId);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error dropping user from organisation: " + err,
        });
      }
    }
  );

  /**
   * Get the user's teams
   */
  app.get(
    API_BASE_PATH + "/user/organisation/:organisationId/teams",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/user/organisation/:organisationId/teams",
      tags: ["user", "teams"],
      summary: "Get the user's teams",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.array(
                  v.object({
                    teamId: v.string(),
                    name: v.string(),
                    role: v.string(),
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
      v.object({
        organisationId: v.string(),
      })
    ),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { organisationId } = c.req.valid("param");
        const teams = await getTeamsByUser(userId, organisationId);
        return c.json(teams);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting user teams: " + err,
        });
      }
    }
  );

  /**
   * Drop the membership of the user itself from a team
   */
  app.delete(
    API_BASE_PATH +
      "/user/organisation/:organisationId/teams/:teamId/membership",
    authAndSetUsersInfo,
    describeRoute({
      method: "delete",
      path: "/user/organisation/:organisationId/teams/:teamId/membership",
      tags: ["user", "teams"],
      summary: "Drop the membership of the user itself from a team",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({
        teamId: v.string(),
      })
    ),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { teamId } = c.req.valid("param");
        await dropUserFromTeam(userId, teamId);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error dropping user from team: " + err,
        });
      }
    }
  );

  /**
   * Get the user's last organisation
   */
  app.get(
    API_BASE_PATH + "/user/last-organisation",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/user/last-organisation",
      tags: ["user"],
      summary: "Get the user's last organisation",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  userId: v.string(),
                  lastOrganisationId: v.string(),
                  organisationName: v.string(),
                })
              ),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const org = await getLastOrganisation(userId);
        return c.json(org);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting last organisation: " + err,
        });
      }
    }
  );

  /**
   * Set the user's last organisation
   */
  app.put(
    API_BASE_PATH + "/user/last-organisation",
    authAndSetUsersInfo,
    describeRoute({
      method: "put",
      path: "/user/last-organisation",
      tags: ["user"],
      summary: "Set the user's last organisation",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  userId: v.string(),
                  lastOrganisationId: v.string(),
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
        organisationId: v.string(),
      })
    ),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const orgId = c.req.valid("json").organisationId;
        const result = await setLastOrganisation(userId, orgId);
        return c.json(result);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error setting last organisation: " + err,
        });
      }
    }
  );

  /**
   * Search for users by email address
   */
  app.get(
    API_BASE_PATH + "/user/search",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/user/search",
      tags: ["user"],
      summary: "Search for users by email address in the whole Application",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  id: v.string(),
                  email: v.string(),
                  firstname: v.string(),
                  surname: v.string(),
                })
              ),
            },
          },
        },
      },
    }),
    validator(
      "query",
      v.object({
        email: v.string(),
      })
    ),
    async (c) => {
      try {
        const email = c.req.valid("query").email;
        const u = await getUserByEmail(email);
        return c.json({
          id: u.id,
          email: u.email,
          firstname: u.firstname,
          surname: u.surname,
        });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting user by email: " + err,
        });
      }
    }
  );

  /**
   * Refresh the own token
   */
  app.get(
    API_BASE_PATH + "/user/refresh-token",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/user/refresh-token",
      tags: ["user"],
      summary: "Refresh the own token",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  token: v.string(),
                  expiresAt: v.string(),
                })
              ),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const userId = c.get("usersId");
        // require a new token. Only a valid logged in user can get this endpoint
        const newTokenData = await LocalAuth.refreshToken(userId);
        return c.json(newTokenData);
      } catch (error) {
        throw new HTTPException(401, {
          message: "Token-Refresh fehlgeschlagen: " + error,
        });
      }
    }
  );

  /**
   * Create a new API token
   */
  app.post(
    API_BASE_PATH + "/user/api-tokens",
    authAndSetUsersInfo,
    describeRoute({
      method: "post",
      path: "/user/api-tokens",
      tags: ["user", "api-tokens"],
      summary: "Create a new API token for the authenticated user",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  token: v.string(),
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
        name: v.string(),
        scopes: v.array(v.string()),
        expiresIn: v.optional(v.number()),
        organisationId: v.string(),
      })
    ),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { name, scopes, expiresIn, organisationId } = c.req.valid("json");

        // check if user is part of that organisation. would throw an error if not
        await getOrganisationMemberRole(organisationId, userId);

        const result = await createApiToken({
          name,
          userId,
          organisationId,
          scopes,
          expiresIn,
        });

        return c.json(result);
      } catch (err) {
        throw new HTTPException(500, {
          message: err + "",
        });
      }
    }
  );

  /**
   * List all API tokens for the authenticated user
   */
  app.get(
    API_BASE_PATH + "/user/api-tokens",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/user/api-tokens",
      tags: ["user", "api-tokens"],
      summary: "List all API tokens for the authenticated user",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.array(
                  v.object({
                    id: v.string(),
                    name: v.string(),
                    scopes: v.array(v.string()),
                    lastUsed: v.optional(v.string()),
                    expiresAt: v.optional(v.string()),
                    createdAt: v.string(),
                    organisationId: v.string(),
                  })
                )
              ),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const tokens = await listApiTokensForUser(userId);
        return c.json(tokens);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error listing API tokens: " + err,
        });
      }
    }
  );

  /**
   * Revoke (delete) an API token
   */
  app.delete(
    API_BASE_PATH + "/user/api-tokens/:tokenId",
    authAndSetUsersInfo,
    describeRoute({
      method: "delete",
      path: "/user/api-tokens/:tokenId",
      tags: ["user", "api-tokens"],
      summary: "Revoke (delete) an API token",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({
        tokenId: v.string(),
      })
    ),
    async (c) => {
      try {
        const userId = c.get("usersId");
        const { tokenId } = c.req.valid("param");

        await revokeApiToken(tokenId, userId);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error revoking API token: " + err,
        });
      }
    }
  );
}
