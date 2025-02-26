/**
 * Routes to manage the fine-tuning data of the AI models
 * Fine-Tuning data is Q/A pairs that are used to train the AI models
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import {
  addFineTuningData,
  deleteFineTuningData,
  getFineTuningEntries,
  getFineTuningEntryById,
  updateFineTuningData,
} from "../../../../../lib/ai/fine-tuning";
import { parseCommaSeparatedListFromUrlParam } from "../../../../../lib/url";
import { RESPONSES } from "../../../../../lib/responses";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../../lib/utils/hono-middlewares";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import {
  fineTuningDataSchema,
  knowledgeEntrySchema,
} from "../../../../../dbSchema";

const fineTuningDataValidation = v.object({
  organisationId: v.string(),
  name: v.optional(v.string()),
  category: v.optional(v.string()),
  data: v.array(
    v.object({
      question: v.string(),
      answer: v.string(),
    })
  ),
});

export default function defineRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**
   * Get fine-tuning data with nested knowledge entry
   * Optional URL params are:
   * - name: string[] comma separated
   * - category: string[] comma separated
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/fine-tuning",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/fine-tuning",
      tags: ["ai"],
      summary: "Get fine-tuning data entries",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(fineTuningDataSchema)),
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
    async (c) => {
      try {
        const { name, category } = c.req.valid("query");
        const { organisationId } = c.req.valid("param");
        const names = parseCommaSeparatedListFromUrlParam(name, []);
        const categories = parseCommaSeparatedListFromUrlParam(category, []);
        const data = await getFineTuningEntries({ names, categories });
        return c.json(data);
      } catch (err) {
        throw new HTTPException(400, { message: err + "" });
      }
    }
  );

  /**
   * Get fine-tuning data by id
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/fine-tuning/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/fine-tuning/:id?",
      tags: ["ai"],
      summary: "Get fine-tuning data entries",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(fineTuningDataSchema)),
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
    async (c) => {
      try {
        const { id } = c.req.valid("param");
        const data = await getFineTuningEntryById(id);
        return c.json(data);
      } catch (err) {
        throw new HTTPException(400, { message: err + "" });
      }
    }
  );

  /**
   * Add new fine-tuning data
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/fine-tuning",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/fine-tuning",
      tags: ["ai"],
      summary: "Add new fine-tuning data",
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
    validator("json", fineTuningDataValidation),
    validator("query", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const body = c.req.valid("json");
        const r = await addFineTuningData(body);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Update fine-tuning data
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/fine-tuning/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/fine-tuning/:id",
      tags: ["ai"],
      summary: "Update fine-tuning data",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(fineTuningDataSchema)),
            },
          },
        },
      },
    }),
    validator("json", fineTuningDataValidation),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        id: v.string(),
      })
    ),
    async (c) => {
      try {
        const { id } = c.req.valid("param");
        const body = c.req.valid("json");
        const r = await updateFineTuningData(id, body);
        return c.json(r);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  /**
   * Delete fine-tuning data
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/fine-tuning/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/fine-tuning/:id",
      tags: ["ai"],
      summary: "Delete fine-tuning data",
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
    async (c) => {
      try {
        const { id } = c.req.valid("param");
        await deleteFineTuningData(id);
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
