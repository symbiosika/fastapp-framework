/**
 * Routes to manage AI provider models of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 * Write operations require organisation admin rights
 */

import { HTTPException } from "../../../../../types";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../../lib/utils/hono-middlewares";
import type { FastAppHono } from "../../../../../types";
import {
  aiProviderModelsInsertSchema,
  aiProviderModelsSelectSchema,
  aiProviderModelsUpdateSchema,
} from "../../../../../lib/db/schema/models";
import * as v from "valibot";
import { validateOrganisationId } from "../../../../../lib/utils/doublecheck-organisation";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { RESPONSES } from "../../../../../lib/responses";
import {
  checkOrganisationIdInBody,
  isOrganisationAdmin,
  isOrganisationMember,
} from "../../..";
import {
  getAllAiProviderModels,
  getAiProviderModelById,
  createAiProviderModel,
  updateAiProviderModel,
  deleteAiProviderModel,
} from "../../../../../lib/ai/models";
import type { SyncModelsResult } from "../../../../../lib/ai/models/types";
import { syncModels } from "../../../../../lib/ai/models/sync";

/**
 * Define the AI provider models management routes
 */
export default function defineModelRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Get all AI provider models for an organisation
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/models",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/models",
      tags: ["models"],
      summary: "Get all AI provider models for an organisation",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(aiProviderModelsSelectSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    validator("query", v.object({ filterAvailable: v.optional(v.string()) })),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const { filterAvailable } = c.req.valid("query");
        const models = await getAllAiProviderModels(
          organisationId,
          filterAvailable === "true" ? true : false
        );
        return c.json(models);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to get AI provider models: " + error,
        });
      }
    }
  );

  /**
   * Get a single AI provider model by ID
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/models/:modelId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/models/:modelId",
      tags: ["models"],
      summary: "Get a single AI provider model by ID",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(aiProviderModelsSelectSchema),
            },
          },
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), modelId: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, modelId } = c.req.valid("param");
        const model = await getAiProviderModelById(organisationId, modelId);
        return c.json(model);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to get AI provider model: " + error,
        });
      }
    }
  );

  /**
   * Create a new AI provider model
   * Requires organisation admin rights
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/models",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/models",
      tags: ["models"],
      summary: "Create a new AI provider model",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(aiProviderModelsSelectSchema),
            },
          },
        },
      },
    }),
    validator("json", aiProviderModelsInsertSchema),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationAdmin,
    checkOrganisationIdInBody,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
        validateOrganisationId(body, organisationId);

        const model = await createAiProviderModel(body);
        return c.json(model);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to create AI provider model: " + error,
        });
      }
    }
  );

  /**
   * Update an AI provider model
   * Requires organisation admin rights
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/models/:modelId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/models/:modelId",
      tags: ["models"],
      summary: "Update an AI provider model",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(aiProviderModelsSelectSchema),
            },
          },
        },
      },
    }),
    validator("json", aiProviderModelsUpdateSchema),
    validator(
      "param",
      v.object({ organisationId: v.string(), modelId: v.string() })
    ),
    isOrganisationAdmin,
    checkOrganisationIdInBody,
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId, modelId } = c.req.valid("param");

        if (body.organisationId) {
          validateOrganisationId(body, organisationId);
        }

        const updatedModel = await updateAiProviderModel(
          organisationId,
          modelId,
          body
        );
        return c.json(updatedModel);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to update AI provider model: " + error,
        });
      }
    }
  );

  /**
   * Delete an AI provider model
   * Requires organisation admin rights
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/models/:modelId",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/models/:modelId",
      tags: ["models"],
      summary: "Delete an AI provider model",
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
      v.object({ organisationId: v.string(), modelId: v.string() })
    ),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { organisationId, modelId } = c.req.valid("param");
        await deleteAiProviderModel(organisationId, modelId);
        return c.json(RESPONSES.SUCCESS);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to delete AI provider model: " + error,
        });
      }
    }
  );

  /**
   * Synchronize models with the public model repository
   * Requires organisation admin rights
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/models/sync",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/models/sync",
      tags: ["models"],
      summary:
        "Synchronize AI provider models with the public model repository",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  added: v.number(),
                  removed: v.number(),
                })
              ),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationAdmin,
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const result: SyncModelsResult = await syncModels(organisationId);
        return c.json(result);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to synchronize AI provider models: " + error,
        });
      }
    }
  );
}
