/**
 * Routes to manage organisations
 * These routes are for the admin of the organisation and normally not used by a SPA or any Frontend
 */

import type { FastAppHono } from "../../types";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../lib/utils/hono-middlewares";
import {
  createOrganisation,
  getOrganisation,
  updateOrganisation,
  deleteOrganisation,
  getOrganisationMembers,
  addOrganisationMember,
} from "../../lib/usermanagement/oganisations";

const BASE_PATH = ""; // "/usermanagement";

export default function defineOrganisationRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Create a new organisation
   */
  app.post(
    API_BASE_PATH + BASE_PATH + "/organisation",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const org = await createOrganisation(data);
        // put the user in the organisation
        await addOrganisationMember(org.id, c.get("usersId"), "admin");
        return c.json(org);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating organisation: " + err,
        });
      }
    }
  );

  /**
   * Get an organisation
   */
  app.get(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        const org = await getOrganisation(c.req.param("organisationId"));
        if (!org) {
          throw new HTTPException(404, { message: "Organisation not found" });
        }
        return c.json(org);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting organisation: " + err,
        });
      }
    }
  );

  /**
   * Get all members of an organisation
   */
  app.get(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/members",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      const userId = c.get("usersId");
      const organisationId = c.req.param("organisationId");
      const members = await getOrganisationMembers(userId, organisationId);
      return c.json(members);
    }
  );

  /**
   * Update an organisation
   */
  app.put(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const org = await updateOrganisation(
          c.req.param("organisationId"),
          data
        );
        return c.json(org);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error updating organisation: " + err,
        });
      }
    }
  );

  /**
   * Delete an organisation
   */
  app.delete(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        await deleteOrganisation(c.req.param("organisationId"));
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error deleting organisation: " + err,
        });
      }
    }
  );
}
