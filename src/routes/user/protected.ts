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
import { users } from "../../lib/db/db-schema";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../lib/db/db-connection";
import { authAndSetUsersInfo } from "../../lib/utils/hono-middlewares";
import { _GLOBAL_SERVER_CONFIG } from "../../store";
import {
  addOrganisationMember,
  createOrganisation,
  dropUserFromOrganisation,
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

const setupValidation = v.object({
  organisationName: v.pipe(v.string(), v.minLength(3), v.maxLength(255)),
});

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
    async (c: Context) => {
      // check if id is set
      const id = c.get("usersId");
      const user = await getDb()
        .select({
          userId: users.id,
          email: users.email,
          firstname: users.firstname,
          surname: users.surname,
          image: users.image,
          meta: users.meta,
          lastOrganisationId: users.lastOrganisationId,
        })
        .from(users)
        .where(eq(users.id, id));

      if (!user || user.length === 0) {
        throw new HTTPException(404, { message: "User not found" });
      } else {
        return c.json(user[0]);
      }
    }
  );

  /**
   * Update the own user
   */
  app.put(
    API_BASE_PATH + "/user/me",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const { firstname, surname, image } = await c.req.json();
        const user = await getDb()
          .update(users)
          .set({ firstname, surname, image })
          .where(eq(users.id, c.get("usersId")))
          .returning();
        return c.json(user);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error updating user: " + err,
        });
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
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        // check if user has an organisation
        const orgs = await getUserOrganisations(userId);
        if (orgs.length > 0) {
          return c.json({ state: "already-setup" });
        }
        const body = await c.req.json();
        const parsed = v.parse(setupValidation, body);

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
    async (c: Context) => {
      const userId = c.get("usersId");
      const usersEmail = c.get("usersEmail");
      const { oldPassword, newPassword } = await c.req.json();
      await LocalAuth.changePassword(usersEmail, oldPassword, newPassword);
      return c.json({ success: true });
    }
  );

  /**
   * Get the user's organisations
   */
  app.get(
    API_BASE_PATH + "/user/organisations",
    authAndSetUsersInfo,
    async (c: Context) => {
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
   * Drop the membership of a user from an organisation
   */
  app.delete(
    API_BASE_PATH + "/user/organisation/:organisationId/membership",
    authAndSetUsersInfo,
    async (c: Context) => {
      const userId = c.get("usersId");
      const organisationId = c.req.param("organisationId");
      try {
        await dropUserFromOrganisation(userId, organisationId);
        return c.json({ success: true });
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
    API_BASE_PATH + "/user/teams",
    authAndSetUsersInfo,
    async (c: Context) => {
      const userId = c.get("usersId");
      const teams = await getTeamsByUser(userId);
      return c.json(teams);
    }
  );

  /**
   * Drop the membership of a user from a team
   */
  app.delete(
    API_BASE_PATH + "/user/team/:teamId/membership",
    authAndSetUsersInfo,
    async (c: Context) => {
      const userId = c.get("usersId");
      const teamId = c.req.param("teamId");
      await dropUserFromTeam(userId, teamId);
      return c.json({ success: true });
    }
  );

  /**
   * Get the user's last organisation
   */
  app.get(
    API_BASE_PATH + "/user/last-organisation",
    authAndSetUsersInfo,
    async (c: Context) => {
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
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const body = await c.req.json();
        const orgId = body.organisationId;
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
    async (c: Context) => {
      const email = c.req.query("email");
      if (!email) {
        throw new HTTPException(400, { message: "email is required" });
      }
      const u = await getDb()
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (!u || u.length === 0) {
        throw new HTTPException(404, { message: "User not found" });
      }
      return c.json({
        id: u[0].id,
        email: u[0].email,
        firstname: u[0].firstname,
        surname: u[0].surname,
      });
    }
  );
}
