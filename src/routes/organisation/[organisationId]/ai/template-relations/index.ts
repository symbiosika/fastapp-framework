/**
 * Routes to manage the relations between prompt templates and knowledge entries
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../../types";
import { HTTPException } from "hono/http-exception";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../../lib/utils/hono-middlewares";
import * as v from "valibot";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { isOrganisationMember, isOrganisationAdmin } from "../../..";
import {
  assignKnowledgeEntriesToPromptTemplate,
  assignKnowledgeFiltersToPromptTemplate,
  assignKnowledgeGroupsToPromptTemplate,
  getKnowledgeEntriesForPromptTemplate,
  getKnowledgeFiltersForPromptTemplate,
  getKnowledgeGroupsForPromptTemplate,
  deleteKnowledgeEntriesFromPromptTemplate,
  deleteKnowledgeFiltersFromPromptTemplate,
  deleteKnowledgeGroupsFromPromptTemplate,
} from "../../../../../lib/ai/prompt-templates/assign-knowledge";

export default function defineRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**
   * Assign knowledge entries to a prompt template
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-entries",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-entries",
      tags: ["ai"],
      summary: "Assign knowledge entries to a prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.object({ success: v.boolean() })),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        knowledgeEntryIds: v.array(v.string()),
      })
    ),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        promptTemplateId: v.string(),
      })
    ),
    validator(
      "query",
      v.object({
        overwrite: v.optional(v.string()), // defaults to true
      })
    ),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { promptTemplateId } = c.req.valid("param");
        const { knowledgeEntryIds } = c.req.valid("json");
        let overwrite = c.req.query("overwrite")
          ? c.req.query("overwrite") === "true"
          : true;

        const result = await assignKnowledgeEntriesToPromptTemplate(
          promptTemplateId,
          knowledgeEntryIds
        );
        return c.json(result);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Assign knowledge filters to a prompt template
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-filters",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-filters",
      tags: ["ai"],
      summary: "Assign knowledge filters to a prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.object({ success: v.boolean() })),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        knowledgeFilterIds: v.array(v.string()),
      })
    ),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        promptTemplateId: v.string(),
      })
    ),
    validator(
      "query",
      v.object({
        overwrite: v.optional(v.string()), // defaults to true
      })
    ),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { promptTemplateId } = c.req.valid("param");
        const { knowledgeFilterIds } = c.req.valid("json");
        let overwrite = c.req.query("overwrite")
          ? c.req.query("overwrite") === "true"
          : true;

        const result = await assignKnowledgeFiltersToPromptTemplate(
          promptTemplateId,
          knowledgeFilterIds,
          overwrite
        );
        return c.json(result);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Assign knowledge groups to a prompt template
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-groups",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-groups",
      tags: ["ai"],
      summary: "Assign knowledge groups to a prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.object({ success: v.boolean() })),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        knowledgeGroupIds: v.array(v.string()),
      })
    ),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        promptTemplateId: v.string(),
      })
    ),
    validator(
      "query",
      v.object({
        overwrite: v.optional(v.string()), // defaults to true
      })
    ),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { promptTemplateId } = c.req.valid("param");
        const { knowledgeGroupIds } = c.req.valid("json");
        let overwrite = c.req.query("overwrite")
          ? c.req.query("overwrite") === "true"
          : true;

        const result = await assignKnowledgeGroupsToPromptTemplate(
          promptTemplateId,
          knowledgeGroupIds,
          overwrite
        );
        return c.json(result);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Get knowledge entries assigned to a prompt template
   */
  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-entries",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-entries",
      tags: ["ai"],
      summary: "Get knowledge entries assigned to a prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.array(
                  v.object({
                    id: v.string(),
                    name: v.string(),
                    description: v.string(),
                  })
                )
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
        const entries =
          await getKnowledgeEntriesForPromptTemplate(promptTemplateId);
        return c.json(entries);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Get knowledge filters assigned to a prompt template
   */
  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-filters",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-filters",
      tags: ["ai"],
      summary: "Get knowledge filters assigned to a prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.array(
                  v.object({
                    id: v.string(),
                    name: v.string(),
                    category: v.string(),
                  })
                )
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
        const filters =
          await getKnowledgeFiltersForPromptTemplate(promptTemplateId);
        return c.json(filters);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Get knowledge groups assigned to a prompt template
   */
  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-groups",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-groups",
      tags: ["ai"],
      summary: "Get knowledge groups assigned to a prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.array(
                  v.object({
                    id: v.string(),
                    name: v.string(),
                    description: v.string(),
                  })
                )
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
        const groups =
          await getKnowledgeGroupsForPromptTemplate(promptTemplateId);
        return c.json(groups);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Remove knowledge entries from a prompt template
   */
  app.delete(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-entries/:knowledgeEntryIds?",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-entries/:knowledgeEntryIds?",
      tags: ["ai"],
      summary: "Remove knowledge entries from a prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.object({ success: v.boolean() })),
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
        knowledgeEntryIds: v.optional(v.string()),
      })
    ),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { promptTemplateId, knowledgeEntryIds } = c.req.valid("param");
        const entryIds = knowledgeEntryIds
          ? knowledgeEntryIds.split(",")
          : undefined;
        const result = await deleteKnowledgeEntriesFromPromptTemplate(
          promptTemplateId,
          entryIds
        );
        return c.json(result);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Remove knowledge filters from a prompt template
   */
  app.delete(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-filters/:knowledgeFilterIds?",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-filters/:knowledgeFilterIds?",
      tags: ["ai"],
      summary: "Remove knowledge filters from a prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.object({ success: v.boolean() })),
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
        knowledgeFilterIds: v.optional(v.string()),
      })
    ),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { promptTemplateId, knowledgeFilterIds } = c.req.valid("param");
        const filterIds = knowledgeFilterIds
          ? knowledgeFilterIds.split(",")
          : undefined;
        const result = await deleteKnowledgeFiltersFromPromptTemplate(
          promptTemplateId,
          filterIds
        );
        return c.json(result);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Remove knowledge groups from a prompt template
   */
  app.delete(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-groups/:knowledgeGroupIds?",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/templates/:promptTemplateId/knowledge-groups/:knowledgeGroupIds?",
      tags: ["ai"],
      summary: "Remove knowledge groups from a prompt template",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.object({ success: v.boolean() })),
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
        knowledgeGroupIds: v.optional(v.string()),
      })
    ),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { promptTemplateId, knowledgeGroupIds } = c.req.valid("param");
        const groupIds = knowledgeGroupIds
          ? knowledgeGroupIds.split(",")
          : undefined;
        const result = await deleteKnowledgeGroupsFromPromptTemplate(
          promptTemplateId,
          groupIds
        );
        return c.json(result);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
