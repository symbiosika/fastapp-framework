/**
 * Routes to manage the invitations of an organisation
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
  getAllOrganisationInvitations,
  acceptOrganisationInvitation,
  declineOrganisationInvitation,
  createOrganisationInvitation,
  acceptAllPendingInvitationsForUser,
  dropOrganisationInvitation,
  declineAllPendingInvitationsForUser,
} from "../../../../lib/usermanagement/invitations";
import * as v from "valibot";

const invitationSchema = v.object({
  organisationId: v.string(),
  email: v.string(),
  role: v.string(),
});

export function defineUserManagementRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Create a new invitation
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/invitations",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const validatedData = v.parse(invitationSchema, data);
        if (validatedData.organisationId !== c.req.param("organisationId")) {
          throw new HTTPException(403, {
            message:
              "You are not allowed to create invitations for the addressed organisation",
          });
        }
        const invitation = await createOrganisationInvitation(validatedData);
        return c.json(invitation);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating invitation: " + err,
        });
      }
    }
  );

  /**
   * Get all invitations of an organisation to manage them as an admin overview
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/invitations",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        const organisationId = c.req.param("organisationId");
        const invitations = await getAllOrganisationInvitations(organisationId);
        return c.json(invitations);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting invitations: " + err,
        });
      }
    }
  );

  /**
   * Drop an invitation by its ID
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/invitations/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        await dropOrganisationInvitation(c.req.param("id"));
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error dropping invitation: " + err,
        });
      }
    }
  );

  /**
   * Accept an invitation by the User himself
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/invitations/:id/accept",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const id = c.req.param("id");
        const organisationId = c.req.param("organisationId");

        if (id.toLowerCase() === "all") {
          await acceptAllPendingInvitationsForUser(userId, organisationId);
        } else {
          await acceptOrganisationInvitation(id, userId, organisationId);
        }
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error accepting invitation: " + err,
        });
      }
    }
  );

  /**
   * Decline an invitation
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/invitations/:id/decline",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      try {
        if (c.req.param("id").toLowerCase() === "all") {
          await declineAllPendingInvitationsForUser(
            c.get("usersId"),
            c.req.param("organisationId")
          );
        } else {
          await declineOrganisationInvitation(c.req.param("id"));
        }

        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error declining invitation: " + err,
        });
      }
    }
  );
}
