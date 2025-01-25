import { HTTPException } from "../../../../types";
import { authAndSetUsersInfo } from "../../../../lib/utils/hono-middlewares";
import { deleteSecret, getSecrets, setSecret } from "../../../../lib/crypt";
import type { FastAppHono } from "../../../../types";
import * as v from "valibot";

const setSecretValidation = v.object({
  name: v.string(),
  value: v.string(),
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
    async (c) => {
      try {
        const organisationId = c.req.param("organisationId");
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
    async (c) => {
      const body = await c.req.json();
      try {
        const parsed = v.parse(setSecretValidation, body);
        const organisationId = c.req.param("organisationId");
        const secret = await setSecret({ ...parsed, organisationId });
        return c.json(secret);
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
    async (c) => {
      const name = c.req.param("name");
      const organisationId = c.req.param("organisationId");
      try {
        await deleteSecret(name, organisationId);
        return c.json({ message: "Secret deleted" });
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to delete secret",
        });
      }
    }
  );
}
