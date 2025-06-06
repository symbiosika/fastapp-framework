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
import { files, filesSelectSchema, getDb } from "../../../../dbSchema";
import { and, eq } from "drizzle-orm";
import {
  isOrganisationAdmin,
  isOrganisationMember,
} from "../../../organisation/index";
import { validateScope } from "../../../../lib/utils/validate-scope";

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
    validateScope("files:write"),
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
    isOrganisationAdmin,
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
    API_BASE_PATH +
      "/organisation/:organisationId/files/:type/:bucket/:filename",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/files/:type/:bucket/:filename",
      tags: ["files"],
      summary: "Get a file",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validateScope("files:read"),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        type: v.union([v.literal("local"), v.literal("db")]),
        bucket: v.string(),
        filename: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, type, bucket, filename } = c.req.valid("param");

        // get the file
        let f: File;
        if (type === "db") {
          f = await getFileFromDb(filename, bucket, organisationId);
        } else if (type === "local") {
          f = await getFileFromLocalDisc(filename, bucket, organisationId);
        } else {
          throw new HTTPException(400, { message: "Invalid type" });
        }
        return new Response(f, {
          status: 200,
          headers: {
            "Content-Type": f.type,
          },
        });
      } catch (err) {
        throw new HTTPException(400, { message: err + "" });
      }
    }
  );

  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/files/:type/:bucket/:id/info",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/files/:type/:bucket/:id/info",
      tags: ["files"],
      summary: "Get a file info",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(filesSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("files:read"),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        type: v.union([v.literal("local"), v.literal("db")]),
        bucket: v.string(),
        id: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, type, bucket, id } = c.req.valid("param");

        if (type === "db") {
          const f = await getDb()
            .select({
              id: files.id,
              name: files.name,
              fileType: files.fileType,
              extension: files.extension,
              createdAt: files.createdAt,
              updatedAt: files.updatedAt,
              organisationId: files.organisationId,
              bucket: files.bucket,
              chatId: files.chatId,
              workspaceId: files.workspaceId,
              expiresAt: files.expiresAt,
            })
            .from(files)
            .where(
              and(
                eq(files.id, id),
                eq(files.bucket, bucket),
                eq(files.organisationId, organisationId)
              )
            );
          if (f.length === 0) {
            throw new HTTPException(404, { message: "File not found" });
          }
          return c.json(f[0]);
        } else {
          throw new HTTPException(400, { message: "Invalid type" });
        }
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
    validateScope("files:write"),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        type: v.union([v.literal("local"), v.literal("db")]),
        bucket: v.string(),
        id: v.string(),
      })
    ),
    isOrganisationMember,
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
