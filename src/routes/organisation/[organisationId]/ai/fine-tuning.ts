/**
 * Routes to manage the fine-tuning data of the AI models
 * Fine-Tuning data is Q/A pairs that are used to train the AI models
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { FastAppHono } from "../../../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import {
  addFineTuningData,
  deleteFineTuningData,
  getFineTuningEntries,
  getFineTuningEntryById,
  updateFineTuningData,
} from "../../../../lib/ai/fine-tuning";
import { parseCommaSeparatedListFromUrlParam } from "../../../../lib/url";
import { RESPONSES } from "../../../../lib/responses";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";

// Add new validation schema
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
export type FineTuningDataInput = v.InferOutput<
  typeof fineTuningDataValidation
>;

export default function defineRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**
   * Get fine-tuning data with nested knowledge entry
   * Optional URL params are:
   * - name: string[] comma separated
   * - category: string[] comma separated
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/fine-tuning/:id?",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      try {
        const id = c.req.param("id");
        const names = parseCommaSeparatedListFromUrlParam(
          c.req.query("name"),
          []
        );
        const categories = parseCommaSeparatedListFromUrlParam(
          c.req.query("category"),
          []
        );
        // only return one item?
        if (id) {
          const data = await getFineTuningEntryById(id);
          return c.json(data);
        } // else
        const data = await getFineTuningEntries({ names, categories });
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
    async (c) => {
      try {
        const body = await c.req.json();
        const parsedBody = v.parse(fineTuningDataValidation, body);
        const r = await addFineTuningData(parsedBody);
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
    async (c) => {
      try {
        const id = c.req.param("id");
        const body = await c.req.json();
        const parsedBody = v.parse(fineTuningDataValidation, body);
        const r = await updateFineTuningData(id, parsedBody);
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
    async (c) => {
      try {
        const id = c.req.param("id");
        await deleteFineTuningData(id);
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
