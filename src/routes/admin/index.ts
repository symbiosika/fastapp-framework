import logger from "../../lib/log";
import fs from "fs/promises";
import path from "path";
import { createGzip } from "zlib";
import { Readable } from "stream";
import { HTTPException, type FastAppHono } from "../../types";
import { describeRoute } from "hono-openapi";
import { RESPONSES } from "../../lib/responses";
import { validator } from "hono-openapi/valibot";
import * as v from "valibot";
import log from "../../lib/log";
import { authAndSetUsersInfo } from "../../lib/utils/hono-middlewares";
import { chatStore } from "../../lib/ai/chat-store";

export default function defineAdminRoutes(app: FastAppHono, basePath: string) {
  /**
   * Download all logs
   */
  app.get(
    basePath + "/admin/logs/download",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/admin/logs/download/:id?",
      tags: ["admin"],
      summary: "Download logs",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/gzip": {
              schema: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const id = c.req.param("id");
        const logFiles = await logger.getLogFilePaths();
        if (logFiles.length === 0) {
          return c.json({ error: "No log files found" }, 404);
        }

        // Concatenate all log contents with file names as headers
        let allLogs = "";
        for (const filePath of logFiles) {
          const content = await fs.readFile(filePath, "utf-8");
          const fileName = path.basename(filePath);
          allLogs += `=== ${fileName} ===\n${content}\n\n`;
        }

        // Create gzip stream and compress data
        const gzip = createGzip();
        const source = Readable.from(allLogs);
        source.pipe(gzip);

        const chunks: Uint8Array[] = [];
        for await (const chunk of gzip) {
          chunks.push(chunk);
        }

        const file = new Blob(chunks, {
          type: "application/gzip",
        });

        return new Response(file, {
          status: 200,
          headers: {
            "Content-Type": "application/gzip",
            "Content-Disposition": 'attachment; filename="logs.txt.gz"',
          },
        });
      } catch (error) {
        console.error("Error creating log archive:", error);
        return c.json({ error: "Failed to create log archive" }, 500);
      }
    }
  );

  /**
   * Download all logs
   */
  app.get(
    basePath + "/admin/logs/chat/:id",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/admin/logs/chat/:id",
      tags: ["admin"],
      summary: "Download logs for a chat session",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    async (c) => {
      try {
        const { id } = c.req.valid("param");
        const chat = await chatStore.get(id);
        if (!chat) {
          throw new HTTPException(404, { message: "Chat session not found" });
        }
        const logContent = await log
          .getCustomLogFileContent(id)
          .catch(() => "");

        return c.json({
          chat,
          log: logContent,
        });
      } catch (error) {
        console.error("Error creating log archive:", error);
        return c.json({ error: "Failed to create log archive" }, 500);
      }
    }
  );

  /**
   * Clear logs
   */
  app.post(
    basePath + "/admin/logs/clear",
    authAndSetUsersInfo,
    describeRoute({
      method: "post",
      path: "/admin/logs/clear",
      tags: ["admin"],
      summary: "Clear logs",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    async (c) => {
      try {
        const logFiles = await logger.getLogFilePaths();
        for (const filePath of logFiles) {
          await fs.unlink(filePath);
        }
        return c.json(RESPONSES.SUCCESS);
      } catch (e) {
        throw new HTTPException(500, { message: e + "" });
      }
    }
  );
}
