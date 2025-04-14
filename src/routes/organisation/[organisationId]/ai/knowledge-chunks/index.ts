import type { FastAppHono } from "../../../../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import { getKnowledgeChunkById } from "../../../../../lib/ai/knowledge-chunks";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../../lib/utils/hono-middlewares";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { knowledgeChunksSchema } from "../../../../../dbSchema";
import { isOrganisationMember } from "../../..";
import { validateScope } from "../../../../../lib/utils/validate-scope";

export default function defineRoutesForKnowledgeChunks(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Get a knowledge chunk by ID
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/chunks/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/knowledge/chunks/:id",
      tags: ["knowledge"],
      summary: "Get a knowledge chunk by ID",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(knowledgeChunksSchema),
            },
          },
        },
      },
    }),
    validateScope("ai:knowledge:read"),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        const userId = c.get("usersId");

        const chunk = await getKnowledgeChunkById(id, organisationId, userId);
        return c.json(chunk);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
