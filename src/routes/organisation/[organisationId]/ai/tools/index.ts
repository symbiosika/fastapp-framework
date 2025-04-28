/**
 * Routes to manage AI Tools
 */
import type { FastAppHono } from "../../../../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../../lib/utils/hono-middlewares";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { isOrganisationMember } from "../../..";
import { validateScope } from "../../../../../lib/utils/validate-scope";
import { getStaticToolOverviewForMyUser } from "../../../../../lib/ai/interaction/tools";

export default function defineToolsRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Get available tools for the organisation
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/tools/available",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/tools/available",
      tags: ["ai"],
      summary: "Get available tools",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  tools: v.array(
                    v.object({
                      name: v.string(),
                      label: v.string(),
                      description: v.string(),
                    })
                  ),
                })
              ),
            },
          },
        },
      },
    }),
    validateScope("ai:tools:read"),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const userId = c.get("usersId");

        const tools = await getStaticToolOverviewForMyUser(
          userId,
          organisationId
        );

        return c.json({
          tools,
        });
      } catch (err) {
        throw new HTTPException(400, { message: err + "" });
      }
    }
  );
}
