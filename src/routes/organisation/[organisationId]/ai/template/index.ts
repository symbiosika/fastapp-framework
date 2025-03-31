/**
 * Routes to manage the prompt templates for each organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import {
  addPromptTemplate,
  addPromptTemplatePlaceholder,
  createFullPromptTemplate,
  deletePromptTemplate,
  deletePromptTemplatePlaceholder,
  getPlaceholdersForPromptTemplate,
  getPlainPlaceholdersForPromptTemplate,
  getPlainTemplate,
  getPromptTemplatePlaceholderById,
  getTemplates,
  updatePromptTemplate,
  updatePromptTemplatePlaceholder,
} from "../../../../../lib/ai/prompt-templates/crud";
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
  promptTemplatePlaceholdersInsertSchema,
  promptTemplatePlaceholdersSelectSchema,
  promptTemplatePlaceholdersUpdateSchema,
  promptTemplatesInsertSchema,
  promptTemplatesSelectSchema,
  promptTemplatesUpdateSchema,
} from "../../../../../dbSchema";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import {
  isOrganisationMember,
  isOrganisationAdmin,
  checkOrganisationIdInBody,
} from "../../..";

const placeholdersSelectWithSuggestionsSchema = v.intersect([
  promptTemplatePlaceholdersSelectSchema,
  v.object({
    suggestions: v.optional(v.array(v.string())),
  }),
]);

const placeholdersInsertWithSuggestionsSchema = v.intersect([
  promptTemplatePlaceholdersInsertSchema,
  v.object({
    id: v.optional(v.string()),
    suggestions: v.optional(v.array(v.string())),
  }),
]);

const placeholdersUpdateWithSuggestionsSchema = v.intersect([
  promptTemplatePlaceholdersUpdateSchema,
  v.object({
    suggestions: v.optional(v.array(v.string())),
  }),
]);

export default function defineRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**
   * Get a plain template
   * URL params:
   * - id: string (optional)
   * - name: string (optional)
   * - category: string (optional)
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/templates",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/templates",
      tags: ["ai"],
      summary: "Get prompt templates",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(promptTemplatesSelectSchema)),
            },
          },
        },
      },
    }),
    validator(
      "query",
      v.object({
        name: v.optional(v.string()),
        category: v.optional(v.string()),
        id: v.optional(v.string()),
      })
    ),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const {
          id: promptId,
          name: promptName,
          category: promptCategory,
        } = c.req.valid("query");
        const { organisationId } = c.req.valid("param");

        if (!promptId && !promptName && !promptCategory) {
          const r = await getTemplates(organisationId);
          return c.json(r);
        }
        const r = await getPlainTemplate({
          promptId,
          promptName,
          promptCategory,
          organisationId,
        });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Add a new prompt template
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/templates",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/templates",
      tags: ["ai"],
      summary: "Create new prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(promptTemplatesSelectSchema),
            },
          },
        },
      },
    }),
    validator("json", promptTemplatesInsertSchema),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationAdmin,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");

        if (organisationId !== body.organisationId) {
          throw new HTTPException(400, {
            message:
              'Parameter "organisationId" does not match body.organisationId',
          });
        }

        const r = await addPromptTemplate({ ...body, organisationId });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Update a prompt template by ID
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/templates/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/templates/:id",
      tags: ["ai"],
      summary: "Update prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(promptTemplatesSelectSchema),
            },
          },
        },
      },
    }),
    validator("json", promptTemplatesUpdateSchema),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        id: v.string(),
      })
    ),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { id, organisationId } = c.req.valid("param");
        const body = c.req.valid("json");

        if (organisationId !== body.organisationId) {
          throw new HTTPException(400, {
            message:
              'Parameter "organisationId" does not match body.organisationId',
          });
        }

        const r = await updatePromptTemplate(body);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Delete a prompt template by ID
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/templates/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/templates/:id",
      tags: ["ai"],
      summary: "Delete prompt template",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        id: v.string(),
      })
    ),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { id, organisationId } = c.req.valid("param");
        const r = await deletePromptTemplate(id, organisationId);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Get all placeholders for a prompt template by ID
   */
  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders",
      tags: ["ai"],
      summary: "Get placeholders for prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.array(placeholdersSelectWithSuggestionsSchema)
              ),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        promptTemplateId: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { promptTemplateId } = c.req.valid("param");
        const r = await getPlainPlaceholdersForPromptTemplate(promptTemplateId);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Get a placeholder for a prompt template by ID
   */
  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders/:id",
      tags: ["ai"],
      summary: "Get placeholder for prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(placeholdersSelectWithSuggestionsSchema),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        promptTemplateId: v.string(),
        id: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { id } = c.req.valid("param");
        const r = await getPromptTemplatePlaceholderById(id);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Add a new placeholder to a prompt template
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders",
      tags: ["ai"],
      summary: "Add a new placeholder to a prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(placeholdersSelectWithSuggestionsSchema),
            },
          },
        },
      },
    }),
    validator("json", placeholdersInsertWithSuggestionsSchema),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        promptTemplateId: v.string(),
      })
    ),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { promptTemplateId } = c.req.valid("param");
        const body = await c.req.valid("json");

        const r = await addPromptTemplatePlaceholder({
          ...body,
          promptTemplateId,
        });

        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Update a prompt-template placeholder by ID
   */
  app.put(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders/:id",
      tags: ["ai"],
      summary: "Update a prompt-template placeholder by ID",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(placeholdersSelectWithSuggestionsSchema),
            },
          },
        },
      },
    }),
    validator("json", placeholdersUpdateWithSuggestionsSchema),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        promptTemplateId: v.string(),
        id: v.string(),
      })
    ),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { promptTemplateId, id } = c.req.valid("param");
        const body = c.req.valid("json");

        const r = await updatePromptTemplatePlaceholder({
          ...body,
          id: body.id ?? id,
          promptTemplateId: promptTemplateId,
        });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Delete a placeholder for a prompt template by ID
   */
  app.delete(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/placeholders/:id",
      tags: ["ai"],
      summary: "Delete a placeholder for a prompt template by ID",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        promptTemplateId: v.string(),
        id: v.string(),
      })
    ),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { promptTemplateId, id } = c.req.valid("param");
        const r = await deletePromptTemplatePlaceholder(id, promptTemplateId);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Get an object with all placeholders for a prompt template with the default values
   * URL params:
   * - promptId: string
   * - promptName: string
   * - promptCategory: string
   * - organisationId: string
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/templates/placeholders",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/templates/placeholders",
      tags: ["ai"],
      summary:
        "Get an object with all placeholders for a prompt template with the default values",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(placeholdersSelectWithSuggestionsSchema),
            },
          },
        },
      },
    }),
    validator(
      "query",
      v.object({
        promptId: v.optional(v.string()),
        promptName: v.optional(v.string()),
        promptCategory: v.optional(v.string()),
        organisationId: v.optional(v.string()),
      })
    ),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const { promptId, promptName, promptCategory, organisationId } =
          c.req.valid("query");

        const r = await getPlaceholdersForPromptTemplate({
          promptId,
          promptName,
          promptCategory,
          organisationId,
        });
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

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

  /**
   * Import a complete prompt template with placeholders and suggestions
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/templates/import",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/templates/import",
      tags: ["ai"],
      summary:
        "Import a complete prompt template with placeholders and suggestions",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(promptTemplatesSelectSchema),
            },
          },
        },
      },
    }),
    validator("json", promptTemplateImportSchema),
    validator("param", v.object({ organisationId: v.string() })),
    validator(
      "query",
      v.object({ overwriteExisting: v.optional(v.boolean()) })
    ),
    checkOrganisationIdInBody,
    isOrganisationAdmin,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const overwriteExisting =
          c.req.valid("query").overwriteExisting ?? false;
        const result = await createFullPromptTemplate(body, overwriteExisting);
        return c.json(result);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
