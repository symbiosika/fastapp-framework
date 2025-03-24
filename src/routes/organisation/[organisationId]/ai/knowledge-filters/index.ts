/**
 * Routes to manage knowledge filters for each organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import {
  upsertFilter,
  updateFilterName,
  updateFilterCategory,
  getFiltersByCategory,
  deleteFilter,
} from "../../../../../lib/ai/knowledge/knowledge-filters";
import { RESPONSES } from "../../../../../lib/responses";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../../lib/utils/hono-middlewares";
import { validateOrganisationId } from "../../../../../lib/utils/doublecheck-organisation";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { isOrganisationAdmin, isOrganisationMember } from "../../..";

const upsertFilterValidation = v.object({
  category: v.string(),
  name: v.string(),
  organisationId: v.string(),
});

const updateFilterNameValidation = v.object({
  category: v.string(),
  oldName: v.string(),
  newName: v.string(),
  organisationId: v.string(),
});

const updateFilterCategoryValidation = v.object({
  oldCategory: v.string(),
  newCategory: v.string(),
  organisationId: v.string(),
});

const deleteFilterValidation = v.object({
  category: v.string(),
  name: v.string(),
  organisationId: v.string(),
});

export default function defineRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**
   * Create or update a knowledge filter
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge-filters",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/knowledge-filters",
      tags: ["knowledge-filters"],
      summary: "Create or update a knowledge filter",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  id: v.string(),
                })
              ),
            },
          },
        },
      },
    }),
    validator("json", upsertFilterValidation),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationAdmin,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
        validateOrganisationId(body, organisationId);

        const filterId = await upsertFilter(
          body.category,
          body.name,
          organisationId
        );

        return c.json({ id: filterId });
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Update a filter's name while keeping its category
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge-filters/name",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/knowledge-filters/name",
      tags: ["knowledge-filters"],
      summary: "Update a filter's name while keeping its category",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator("json", updateFilterNameValidation),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationAdmin,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
        validateOrganisationId(body, organisationId);

        await updateFilterName(
          body.category,
          body.oldName,
          body.newName,
          organisationId
        );

        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Update all filters of a specific category to a new category name
   */
  app.put(
    API_BASE_PATH +
      "/organisation/:organisationId/ai/knowledge-filters/category",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/knowledge-filters/category",
      tags: ["knowledge-filters"],
      summary:
        "Update all filters of a specific category to a new category name",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator("json", updateFilterCategoryValidation),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationAdmin,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
        validateOrganisationId(body, organisationId);

        await updateFilterCategory(
          body.oldCategory,
          body.newCategory,
          organisationId
        );

        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Get all filters grouped by category
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge-filters",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/knowledge-filters",
      tags: ["knowledge-filters"],
      summary: "Get all filters grouped by category",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.record(v.string(), v.array(v.string()))),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const filters = await getFiltersByCategory(organisationId);
        return c.json(filters);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Delete a filter
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/knowledge-filters",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/knowledge-filters",
      tags: ["knowledge-filters"],
      summary: "Delete a filter",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "query",
      v.object({
        category: v.string(),
        name: v.string(),
      })
    ),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationAdmin,
    async (c) => {
      try {
        const query = c.req.valid("query");
        const { organisationId } = c.req.valid("param");

        await deleteFilter(query.category, query.name, organisationId);

        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
