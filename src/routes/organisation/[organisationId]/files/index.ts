/**
 * Routes to manage the files of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  deleteFileFromDB,
  saveFileToDb,
  getFileFromDb,
} from "../../../../lib/storage/db";
import {
  deleteFileFromLocalDisc,
  getFileFromLocalDisc,
  saveFileToLocalDisc,
} from "../../../../lib/storage/local";
import type { FastAppHono } from "../../../../types";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";

/**
 * Upload a file to the database
 */
export const FileHandler = {
  async postFile(c: Context, type: "db" | "local") {
    try {
      const bucket = c.req.param("bucket");
      const organisationId = c.req.param("organisationId");

      // check if the header is set to form-data
      const contentType = c.req.header("content-type");
      if (!contentType || !contentType.includes("multipart/form-data")) {
        return c.json({ message: "Invalid content type" }, { status: 400 });
      }
      // Parse the form data
      const form = await c.req.formData();
      const file = form.get("file") as File;

      if (type === "db") {
        const entry = await saveFileToDb(file, bucket, organisationId);
        return c.json(entry);
      } else if (type === "local") {
        const entry = await saveFileToLocalDisc(file, bucket, organisationId);
        return c.json(entry);
      }
    } catch (err) {
      throw new HTTPException(400, { message: err + "" });
    }
  },

  /**
   * Get a file from the database
   */
  async getFile(c: Context, type: "db" | "local") {
    try {
      const id = c.req.param("id");
      const bucket = c.req.param("bucket");
      const organisationId = c.req.param("organisationId");

      // get the file
      let f: File;
      if (type === "db") {
        f = await getFileFromDb(id, bucket, organisationId);
      } else if (type === "local") {
        f = await getFileFromLocalDisc(id, bucket, organisationId);
      } else {
        throw new HTTPException(400, { message: "Invalid type" });
      }
      return new Response(f, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });
    } catch (err) {
      throw new HTTPException(400, { message: err + "" });
    }
  },

  /**
   * Delete a file from the database
   */
  async deleteFile(c: Context, type: "db" | "local") {
    try {
      const id = c.req.param("id");
      const bucket = c.req.param("bucket");
      const organisationId = c.req.param("organisationId");

      // delete the file
      if (type === "db") {
        await deleteFileFromDB(id, bucket, organisationId);
      } else if (type === "local") {
        await deleteFileFromLocalDisc(id, bucket, organisationId);
      }

      return new Response(null, { status: 204 });
    } catch (err) {
      throw new HTTPException(400, { message: err + "" });
    }
  },
};

/**
 * Define the payment routes
 */
export function defineFilesRoutes(app: FastAppHono, API_BASE_PATH: string) {
  /**
   * Save and serve files that are stored in the database
   */
  app.all(
    API_BASE_PATH + "/organisation/:organisationId/files/:type/:bucket/:id?",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c: Context) => {
      // check if id is set
      const id = c.req.param("id");
      const type = c.req.param("type");

      if (type !== "local" && type !== "db") {
        throw new HTTPException(400, { message: "Invalid type" });
      }

      if (!id) {
        if (c.req.method === "POST") {
          return FileHandler.postFile(c, type);
        } else {
          throw new HTTPException(405, { message: "Method not allowed" });
        }
      } else {
        if (c.req.method === "GET") {
          return FileHandler.getFile(c, type);
        } else if (c.req.method === "DELETE") {
          return FileHandler.deleteFile(c, type);
        } else {
          throw new HTTPException(405, { message: "Method not allowed" });
        }
      }
    }
  );
}
