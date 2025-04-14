/**
 * Routes to manage the prompt snippets
 */
import type { FastAppHono } from "../../../../../types";
import { HTTPException } from "hono/http-exception";
import { parseCommaSeparatedListFromUrlParam } from "../../../../../lib/url";
import { RESPONSES } from "../../../../../lib/responses";
import {
  getPromptSnippets,
  getPromptSnippetById,
  addPromptSnippet,
  updatePromptSnippet,
  deletePromptSnippet,
} from "../../../../../lib/ai/prompt-snippets";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../../lib/utils/hono-middlewares";
import * as v from "valibot";
import {
  promptSnippetsInsertSchema,
  promptSnippetsSelectSchema,
  promptSnippetsUpdateSchema,
} from "../../../../../dbSchema";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { isOrganisationMember } from "../../..";
import { validateScope } from "../../../../../lib/utils/validate-scope";

export default function defineRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**
   * Get prompt snippets
   * Optional URL params are:
   * - name: string[] comma separated
   * - category: string[] comma separated
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/prompt-snippets",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/prompt-snippets/:id?",
      tags: ["ai"],
      summary: "Get prompt snippets",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(promptSnippetsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("ai:prompt-snippets:read"),
    validator(
      "query",
      v.object({
        name: v.optional(v.string()),
        category: v.optional(v.string()),
      })
    ),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const { name, category } = c.req.valid("query");
        const { organisationId } = c.req.valid("param");
        const names = parseCommaSeparatedListFromUrlParam(name, []);
        const categories = parseCommaSeparatedListFromUrlParam(category, []);

        const snippets = await getPromptSnippets({
          userId: c.get("usersId"),
          names,
          categories,
          organisationId,
        });
        return c.json(snippets);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Get a prompt snippet by ID
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/prompt-snippets/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/prompt-snippets/:id",
      tags: ["ai"],
      summary: "Get prompt snippet by ID",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(promptSnippetsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("ai:prompt-snippets:read"),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        id: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, id } = c.req.valid("param");
        const snippet = await getPromptSnippetById(
          id,
          organisationId,
          c.get("usersId")
        );
        return c.json(snippet);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Add a new prompt snippet
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/prompt-snippets",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/prompt-snippets",
      tags: ["ai"],
      summary: "Add a new prompt snippet",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(promptSnippetsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("ai:prompt-snippets:write"),
    validator("json", promptSnippetsInsertSchema),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const usersId = c.get("usersId");
        const organisationId = c.req.valid("param").organisationId;
        const snippet = await addPromptSnippet({
          ...body,
          userId: usersId,
          organisationId,
        });
        return c.json(snippet);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Update a prompt snippet
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/prompt-snippets/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/prompt-snippets/:id",
      tags: ["ai"],
      summary: "Update a prompt snippet",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(promptSnippetsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("ai:prompt-snippets:write"),
    validator("json", promptSnippetsUpdateSchema),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { id, organisationId } = c.req.valid("param");
        const body = c.req.valid("json");
        const snippet = await updatePromptSnippet(
          id,
          organisationId,
          {
            ...body,
          },
          c.get("usersId")
        );
        return c.json(snippet);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Delete a prompt snippet
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/prompt-snippets/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/prompt-snippets/:id",
      tags: ["ai"],
      summary: "Delete a prompt snippet",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validateScope("ai:prompt-snippets:write"),
    validator(
      "param",
      v.object({ organisationId: v.string(), id: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { id, organisationId } = c.req.valid("param");
        await deletePromptSnippet(id, organisationId, c.get("usersId"));
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
