/**
 * Routes to manage the invitations of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../types";
import { HTTPException } from "hono/http-exception";
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
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import {
  organisationInvitationsInsertSchema,
  organisationInvitationsSelectSchema,
} from "../../../../dbSchema";
import { RESPONSES } from "../../../../lib/responses";

export default function defineInvitationsRoutes(
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
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/invitations",
      tags: ["invitations"],
      summary: "Create a new invitation",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(organisationInvitationsSelectSchema),
            },
          },
        },
      },
    }),
    validator("json", organisationInvitationsInsertSchema),
    async (c) => {
      try {
        const data = c.req.valid("json");
        if (data.organisationId !== c.req.param("organisationId")) {
          throw new HTTPException(403, {
            message:
              "You are not allowed to create invitations for the addressed organisation",
          });
        }
        const invitation = await createOrganisationInvitation(data);
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
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/invitations",
      tags: ["invitations"],
      summary:
        "Get all invitations of an organisation to manage them as an admin overview",
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
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const userId = c.get("usersId");
        const invitations = await getAllOrganisationInvitations(
          userId,
          organisationId
        );
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
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/invitations/:id",
      tags: ["invitations"],
      summary: "Drop an invitation by its ID",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        await dropOrganisationInvitation(id);
        return c.json(RESPONSES.SUCCESS);
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
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/invitations/:id/accept",
      tags: ["invitations"],
      summary: "Accept an invitation by the User himself",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        const userId = c.get("usersId");

        if (id.toLowerCase() === "all") {
          await acceptAllPendingInvitationsForUser(userId, organisationId);
        } else {
          await acceptOrganisationInvitation(id, userId, organisationId);
        }
        return c.json(RESPONSES.SUCCESS);
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
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/invitations/:id/decline",
      tags: ["invitations"],
      summary: "Decline an invitation",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        if (id.toLowerCase() === "all") {
          await declineAllPendingInvitationsForUser(
            c.get("usersId"),
            organisationId
          );
        } else {
          await declineOrganisationInvitation(id);
        }

        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error declining invitation: " + err,
        });
      }
    }
  );
}
