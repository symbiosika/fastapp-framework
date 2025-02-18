/**
 * Routes to manage the files of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 */
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
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from "valibot";

/**
 * Define the payment routes
 */
export function defineFilesRoutes(app: FastAppHono, API_BASE_PATH: string) {
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/files/:type/:bucket",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/files/:type/:bucket",
      tags: ["files"],
      summary: "Save files",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  path: v.string(),
                  id: v.string(),
                  name: v.string(),
                  organisationId: v.string(),
                })
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
        type: v.union([v.literal("local"), v.literal("db")]),
        bucket: v.string(),
      })
    ),
    validator(
      "form",
      v.object({
        file: v.any(),
        chatId: v.optional(v.string()),
        workspaceId: v.optional(v.string()),
      })
    ),
    async (c) => {
      try {
        const { organisationId, type, bucket } = c.req.valid("param");
        const form = c.req.valid("form");

        const options = {
          ...(form.chatId && { chatId: form.chatId }),
          ...(form.workspaceId && { workspaceId: form.workspaceId }),
        };

        if (type === "db") {
          const entry = await saveFileToDb(
            form.file,
            bucket,
            organisationId,
            options
          );
          return c.json(entry);
        } else if (type === "local") {
          const entry = await saveFileToLocalDisc(
            form.file,
            bucket,
            organisationId,
            options
          );
          return c.json(entry);
        }
      } catch (err) {
        throw new HTTPException(400, { message: err + "" });
      }
    }
  );

  app.get(
    API_BASE_PATH + "/organisation/:organisationId/files/:type/:bucket/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/files/:type/:bucket/:id",
      tags: ["files"],
      summary: "Get a file",
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
        type: v.union([v.literal("local"), v.literal("db")]),
        bucket: v.string(),
        id: v.string(),
      })
    ),
    async (c) => {
      try {
        const { organisationId, type, bucket, id } = c.req.valid("param");

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
    }
  );

  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/files/:type/:bucket/:id",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/files/:type/:bucket/:id",
      tags: ["files"],
      summary: "Delete a file",
      responses: {
        204: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        type: v.union([v.literal("local"), v.literal("db")]),
        bucket: v.string(),
        id: v.string(),
      })
    ),
    async (c) => {
      try {
        const { organisationId, type, bucket, id } = c.req.valid("param");

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
    }
  );
}
