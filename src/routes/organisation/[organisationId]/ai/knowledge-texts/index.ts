/**
 * Routes to manage the knowledge entries for each organisation
 * These routes are protected by JWT and CheckPermission middleware
 */
import type { FastAppHono } from "../../../../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import { RESPONSES } from "../../../../../lib/responses";
import {
  createKnowledgeText,
  getKnowledgeText,
  updateKnowledgeText,
  deleteKnowledgeText,
} from "../../../../../lib/ai/knowledge/knowledge-texts";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../../lib/utils/hono-middlewares";
import { validateOrganisationId } from "../../../../../lib/utils/doublecheck-organisation";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import {
  knowledgeEntrySchema,
  knowledgeTextInsertSchema,
  knowledgeTextUpdateSchema,
} from "../../../../../dbSchema";
import { isOrganisationMember } from "../../..";

export default function defineRoutesForKnowledgeTexts(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Create a new knowledge text entry
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/texts",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/knowledge/texts",
      tags: ["knowledge"],
      summary: "Create a new knowledge text entry",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator("json", knowledgeTextInsertSchema),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
        validateOrganisationId(body, organisationId);

        const r = await createKnowledgeText({
          ...body,
          userId: c.get("usersId"),
        });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Read knowledge text entries
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/texts",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/knowledge/texts",
      tags: ["knowledge"],
      summary: "Read knowledge text entries",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(knowledgeEntrySchema)),
            },
          },
        },
      },
    }),
    validator(
      "query",
      v.object({
        id: v.optional(v.string()),
        teamId: v.optional(v.string()),
        workspaceId: v.optional(v.string()),
        limit: v.optional(v.string()),
        page: v.optional(v.string()),
      })
    ),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const {
          id,
          teamId,
          workspaceId,
          limit: limitStr,
          page: pageStr,
        } = c.req.valid("query");
        const { organisationId } = c.req.valid("param");
        const userId = c.get("usersId");
        const limit = limitStr ? parseInt(limitStr) : undefined;
        const page = pageStr ? parseInt(pageStr) : undefined;

        const r = await getKnowledgeText({
          id,
          limit,
          page,
          organisationId,
          userId,
          teamId,
          workspaceId,
        });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Update a knowledge text entry
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/texts/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/knowledge/texts/:id",
      tags: ["knowledge"],
      summary: "Update a knowledge text entry",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(knowledgeEntrySchema),
            },
          },
        },
      },
    }),
    validator("json", knowledgeTextUpdateSchema),
    validator(
      "query",
      v.object({
        teamId: v.optional(v.string()),
        workspaceId: v.optional(v.string()),
      })
    ),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { teamId, workspaceId } = c.req.valid("query");
        const { organisationId, id } = c.req.valid("param");
        const body = c.req.valid("json");
        const userId = c.get("usersId");
        validateOrganisationId(body, organisationId);

        const r = await updateKnowledgeText(id, body, {
          organisationId,
          userId,
          teamId,
          workspaceId,
        });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Delete a knowledge text entry
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge/texts/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/knowledge/texts/:id",
      tags: ["knowledge"],
      summary: "Delete a knowledge text entry",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "query",
      v.object({
        teamId: v.optional(v.string()),
        workspaceId: v.optional(v.string()),
      })
    ),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { teamId, workspaceId } = c.req.valid("query");
        const { organisationId, id } = c.req.valid("param");
        const userId = c.get("usersId");

        await deleteKnowledgeText(id, {
          organisationId,
          userId,
          teamId,
          workspaceId,
        });
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
