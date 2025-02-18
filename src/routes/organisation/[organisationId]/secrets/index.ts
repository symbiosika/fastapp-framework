/**
 * Routes to manage the secrets of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import { HTTPException } from "../../../../types";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";
import { deleteSecret, getSecrets, setSecret } from "../../../../lib/crypt";
import type { FastAppHono } from "../../../../types";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from "valibot";
import { describeRoute } from "hono-openapi";
import { RESPONSES } from "../../../../lib/responses";

const setSecretValidation = v.object({
  name: v.string(),
  value: v.string(),
});

const secretResponseSchema = v.object({
  id: v.string(),
  name: v.string(),
  createdAt: v.string(),
});

/**
 * Define the backend secret management routes
 */
export default function defineManageSecretsRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/secrets",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/secrets",
      tags: ["secrets"],
      summary: "Get all secrets for an organisation",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(secretResponseSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const value = await getSecrets(organisationId);
        return c.json(value);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to get secrets",
        });
      }
    }
  );

  /**
   * Add or update a backend secret
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/secrets",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/secrets",
      tags: ["secrets"],
      summary: "Add or update a backend secret",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(secretResponseSchema),
            },
          },
        },
      },
    }),
    validator("json", setSecretValidation),
    validator("param", v.object({ organisationId: v.string() })),
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const parsed = c.req.valid("json");
        const secret = await setSecret({ ...parsed, organisationId });
        return c.json({
          id: secret.id,
          name: secret.name,
          createdAt: secret.createdAt,
        });
      } catch (error) {
        throw new HTTPException(400, {
          message: error + "",
        });
      }
    }
  );

  /**
   * Delete a secret
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/secrets/:name",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/secrets/:name",
      tags: ["secrets"],
      summary: "Delete a secret",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({ organisationId: v.string(), name: v.string() })
    ),
    async (c) => {
      const { organisationId, name } = c.req.valid("param");
      try {
        await deleteSecret(name, organisationId);
        return c.json(RESPONSES.SUCCESS);
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to delete secret",
        });
      }
    }
  );
}
