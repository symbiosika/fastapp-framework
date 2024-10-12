import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  deleteFileFromDB,
  saveFileToDb,
  getFileFromDb,
} from "src/lib/storage/db";
import {
  deleteFileFromLocalDisc,
  getFileFromLocalDisc,
  saveFileToLocalDisc,
} from "src/lib/storage/local";

/**
 * Upload a file to the database
 */
export default {
  async postFile(c: Context, type: "db" | "local") {
    try {
      const bucket = c.req.param("bucket");

      // check if the header is set to form-data
      const contentType = c.req.header("content-type");
      if (!contentType || !contentType.includes("multipart/form-data")) {
        return c.json({ message: "Invalid content type" }, { status: 400 });
      }
      // Parse the form data
      const form = await c.req.formData();
      const file = form.get("file") as File;

      if (type === "db") {
        const entry = await saveFileToDb(file, bucket);
        return c.json(entry);
      } else if (type === "local") {
        const entry = await saveFileToLocalDisc(file, bucket);
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

      // get the file
      let f: File;
      if (type === "db") {
        f = await getFileFromDb(id, bucket);
      } else if (type === "local") {
        f = await getFileFromLocalDisc(id, bucket);
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

      // delete the file
      if (type === "db") {
        await deleteFileFromDB(id, bucket);
      } else if (type === "local") {
        await deleteFileFromLocalDisc(id, bucket);
      }

      return new Response(null, { status: 204 });
    } catch (err) {
      throw new HTTPException(400, { message: err + "" });
    }
  },
};
