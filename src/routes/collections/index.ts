import type { FastAppHono } from "../../types";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import { authAndSetUsersInfo } from "../../helper";
import { getCollection, postCollection } from "./[name]";
import {
  deleteCollectionById,
  getCollectionById,
  putCollectionById,
} from "./[name]/[id]";

/**
 * Define the payment routes
 */
export function defineCollectionRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Collections endpoint
   */
  app.all(
    API_BASE_PATH + "/db/collections/:name/:id?",
    authAndSetUsersInfo,
    async (c: Context) => {
      // check if id is set
      const id = c.req.param("id");
      if (!id) {
        if (c.req.method === "GET") {
          return getCollection(c);
        } else if (c.req.method === "POST") {
          return postCollection(c);
        } else {
          throw new HTTPException(405, { message: "Method not allowed" });
        }
      } else {
        if (c.req.method === "GET") {
          return getCollectionById(c);
        } else if (c.req.method === "PUT") {
          return putCollectionById(c);
        } else if (c.req.method === "DELETE") {
          return deleteCollectionById(c);
        } else {
          throw new HTTPException(405, { message: "Method not allowed" });
        }
      }
    }
  );
}
