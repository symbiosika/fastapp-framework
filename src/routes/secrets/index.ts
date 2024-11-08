import { HTTPException } from "../..";
import { authAndSetUsersInfo } from "../../helper";
import { getSecrets, setSecret } from "../../lib/crypt";
import type { FastAppHono } from "../../types";
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
  app.get(API_BASE_PATH + "/secrets", authAndSetUsersInfo, async (c) => {
    try {
      const value = await getSecrets();
      return c.json(value);
    } catch (error) {
      throw new HTTPException(500, {
        message: "Failed to get secrets",
      });
    }
  });

  /**
   * Add or update a backend secret
   */
  app.post(API_BASE_PATH + "/secrets", authAndSetUsersInfo, async (c) => {
    const body = await c.req.json();
    try {
      const parsed = v.parse(setSecretValidation, body);
      const secret = await setSecret(parsed);
      return c.json(secret);
    } catch (error) {
      throw new HTTPException(400, {
        message: error + "",
      });
    }
  });
}
