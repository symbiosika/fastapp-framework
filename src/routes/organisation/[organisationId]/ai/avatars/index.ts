// src/routes/avatars/index.ts
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from "valibot";
import  { type FastAppHono, HTTPException } from "../../../../../types";
import { authAndSetUsersInfo } from "../../../../../lib/utils/hono-middlewares";
import { createAvatar, listAvatars } from "../../../../../lib/ai/avatars";
import {
  avatarSelectSchema,
  avatarUpdateSchema,
} from "../../../../../dbSchema";
import {
  deleteAvatar,
  getAvatar,
  updateAvatar,
} from "../../../../../lib/ai/avatars";

export default function defineAvatarRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  // Create avatar
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/ai/avatars",
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/ai/avatars",
      tags: ["avatars"],
      summary: "Create a new avatar",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/gzip": {
              schema: resolver(avatarSelectSchema),
            },
          },
        },
      },
    }),
    authAndSetUsersInfo,
    validator(
      "json",
      v.object({
        name: v.string(),
        description: v.string(),
      })
    ),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { organisationId } = c.req.valid("param");
        const userId = c.get("usersId");

        const avatar = await createAvatar({
          ...body,
          organisationId,
          userId,
        });

        return c.json(avatar);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  // List avatars
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/avatars",
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/avatars",
      tags: ["avatars"],
      summary: "List all avatars",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/gzip": {
              schema: resolver(avatarSelectSchema),
            },
          },
        },
      },
    }),
    authAndSetUsersInfo,
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const avatars = await listAvatars(organisationId);
        return c.json(avatars);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  // Get avatar
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/ai/avatars/:avatarId",
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/ai/avatars/:avatarId",
      tags: ["avatars"],
      summary: "Get an avatar",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/gzip": {
              schema: resolver(avatarSelectSchema),
            },
          },
        },
      },
    }),
    authAndSetUsersInfo,
    validator(
      "param",
      v.object({ organisationId: v.string(), avatarId: v.string() })
    ),
    async (c) => {
      try {
        const { organisationId, avatarId } = c.req.valid("param");
        const avatar = await getAvatar(organisationId, avatarId);
        return c.json(avatar);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  // Update avatar
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/ai/avatars/:avatarId",
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/ai/avatars/:avatarId",
      tags: ["avatars"],
      summary: "Update an avatar",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/gzip": {
              schema: resolver(avatarSelectSchema),
            },
          },
        },
      },
    }),
    authAndSetUsersInfo,
    validator("json", avatarUpdateSchema),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        avatarId: v.string(),
      })
    ),
    async (c) => {
      try {
        const body = c.req.valid("json");
        const { avatarId } = c.req.valid("param");
        const { organisationId } = c.req.valid("param");
        const userId = c.get("usersId");

        const avatar = await updateAvatar(avatarId, body, {
          organisationId,
          userId,
        });
        if (!avatar) {
          throw new HTTPException(404, { message: "Avatar not found" });
        }

        return c.json(avatar);
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );

  // Delete avatar
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/ai/avatars/:avatarId",
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/ai/avatars/:avatarId",
      tags: ["avatars"],
      summary: "Delete an avatar",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    authAndSetUsersInfo,
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        avatarId: v.string(),
      })
    ),
    async (c) => {
      try {
        const { avatarId } = c.req.valid("param");
        const { organisationId } = c.req.valid("param");
        const userId = c.get("usersId");

        const success = await deleteAvatar(avatarId, {
          organisationId,
          userId,
        });

        if (!success) {
          throw new HTTPException(404, { message: "Avatar not found" });
        }

        return c.json({ success: true });
      } catch (e) {
        throw new HTTPException(400, { message: e + "" });
      }
    }
  );
}
