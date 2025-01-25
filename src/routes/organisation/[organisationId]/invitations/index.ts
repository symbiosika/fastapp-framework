import type { FastAppHono } from "../../../../types";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import { authAndSetUsersInfo } from "../../../../lib/utils/hono-middlewares";
import {
  getAllOrganisationInvitations,
  acceptOrganisationInvitation,
  declineOrganisationInvitation,
  createOrganisationInvitation,
  acceptAllPendingInvitationsForUser,
} from "../../../../lib/usermanagement/invitations";

const BASE_PATH = "/usermanagement";

export function defineUserManagementRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  // ---
  // Invitation routes
  // ---

  app.post(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/invitations",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const invitation = await createOrganisationInvitation(data);
        return c.json(invitation);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating invitation: " + err,
        });
      }
    }
  );

  app.get(
    API_BASE_PATH + BASE_PATH + "/organisation/:organisationId/invitations",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const invitations = await getAllOrganisationInvitations();
        return c.json(invitations);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting invitations: " + err,
        });
      }
    }
  );

  app.post(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/invitations/:id/accept",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const id = c.req.param("id");

        if (id.toLowerCase() === "all") {
          await acceptAllPendingInvitationsForUser(userId);
        } else {
          await acceptOrganisationInvitation(id, userId);
        }
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error accepting invitation: " + err,
        });
      }
    }
  );

  app.post(
    API_BASE_PATH +
      BASE_PATH +
      "/organisation/:organisationId/invitations/:id/decline",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        await declineOrganisationInvitation(c.req.param("id"));
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error declining invitation: " + err,
        });
      }
    }
  );
}
