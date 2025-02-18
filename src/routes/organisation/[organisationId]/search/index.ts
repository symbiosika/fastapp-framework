/**
 * Routes to manage the secrets of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 */
import { HTTPException } from "../../../../types";
import { authAndSetUsersInfo } from "../../../../lib/utils/hono-middlewares";
import type { FastAppHono } from "../../../../types";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from "valibot";
import { describeRoute } from "hono-openapi";
import { getUserByEmail } from "../../../../lib/usermanagement/user";
import { isOrganisationMember } from "../..";

/**
 * Define the backend secret management routes
 */
export default function defineSearchInOrganisationRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Search for users by email address inside an organisation
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/search/user",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/search/user",
      tags: ["search"],
      summary: "Search for users by email address inside an organisation",
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
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const email = c.req.valid("query").email;
        const { organisationId } = c.req.valid("param");
        const u = await getUserByEmail(email, organisationId);
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
}
