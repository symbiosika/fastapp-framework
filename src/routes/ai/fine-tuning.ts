import type { FastAppHono } from "../../types";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import {
  addFineTuningData,
  deleteFineTuningData,
  getFineTuningEntries,
  getFineTuningEntryById,
  updateFineTuningData,
} from "../../lib/ai/fine-tuning";
import { parseCommaSeparatedListFromUrlParam } from "../../lib/url";
import { RESPONSES } from "../../lib/responses";

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

export default function defineRoutes(app: FastAppHono) {
  /**
   * Get fine-tuning data with nested knowledge entry
   * Optional URL params are:
   * - name: string[] comma separated
   * - category: string[] comma separated
   */
  app.get("/fine-tuning/:id?", async (c) => {
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
  });

  /**
   * Add new fine-tuning data
   */
  app.post("/fine-tuning", async (c) => {
    try {
      const body = await c.req.json();
      const parsedBody = v.parse(fineTuningDataValidation, body);
      const r = await addFineTuningData(parsedBody);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Update fine-tuning data
   */
  app.put("/fine-tuning/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const parsedBody = v.parse(fineTuningDataValidation, body);
      const r = await updateFineTuningData(id, parsedBody);
      return c.json(r);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });

  /**
   * Delete fine-tuning data
   */
  app.delete("/fine-tuning/:id", async (c) => {
    try {
      const id = c.req.param("id");
      await deleteFineTuningData(id);
      return c.json(RESPONSES.SUCCESS);
    } catch (e) {
      throw new HTTPException(400, { message: e + "" });
    }
  });
}
