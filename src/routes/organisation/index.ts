/**
 * Routes to manage organisations
 * These routes are for the admin of the organisation and normally not used by a SPA or any Frontend
 */
import type { FastAppHono } from "../../types";
import { HTTPException } from "hono/http-exception";
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
import { RESPONSES } from "../../lib/responses";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from "valibot";
import {
  organisationsInsertSchema,
  organisationsSelectSchema,
  organisationsUpdateSchema,
} from "../../dbSchema";

export default function defineOrganisationRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Create a new organisation
   */
  app.post(
    API_BASE_PATH + "/organisation",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation",
      summary: "Create a new organisation",
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
    validator("json", organisationsInsertSchema),
    async (c) => {
      try {
        const data = c.req.valid("json");
        // create the organisation
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
    API_BASE_PATH + "/organisation/:organisationId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId",
      summary: "Get an organisation",
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
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const org = await getOrganisation(c.req.valid("param").organisationId);
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
    API_BASE_PATH + "/organisation/:organisationId/members",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/members",
      summary: "Get all members of an organisation",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.array(
                  v.object({
                    userEmail: v.string(),
                    role: v.union([
                      v.literal("admin"),
                      v.literal("member"),
                      v.literal("owner"),
                    ]),
                    joinedAt: v.string(),
                  })
                )
              ),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      const userId = c.get("usersId");
      const organisationId = c.req.valid("param").organisationId;
      const members = await getOrganisationMembers(userId, organisationId);
      return c.json(members);
    }
  );

  /**
   * Update an organisation
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId",
      summary: "Update an organisation",
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
    validator("json", organisationsUpdateSchema),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const data = c.req.valid("json");
        const org = await updateOrganisation(
          c.req.valid("param").organisationId,
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
    API_BASE_PATH + "/organisation/:organisationId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId",
      summary: "Delete an organisation",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        await deleteOrganisation(c.req.valid("param").organisationId);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error deleting organisation: " + err,
        });
      }
    }
  );
}
