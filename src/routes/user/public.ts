/**
 * Routes to register and login a user.
 * These routes are not secured and public.
 */

import type {
  CustomPostRegisterAction,
  CustomPreRegisterVerification,
  FastAppHono,
} from "../../types";
import { HTTPException } from "hono/http-exception";
import { LocalAuth } from "../../lib/auth";
import log from "../../lib/log";
import { _GLOBAL_SERVER_CONFIG } from "../../store";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from "valibot";
import { usersRestrictedSelectSchema, usersSelectSchema } from "../../dbSchema";
import { RESPONSES } from "../../lib/responses";
import { verifyPasswordResetToken } from "../../lib/auth/magic-link";

/**
 * Pre-register custom verification
 */
const preRegisterCustomVerifications: CustomPreRegisterVerification[] = [];
const postRegisterActions: CustomPostRegisterAction[] = [];

/**
 * Register new verification
 */
export const registerPreRegisterCustomVerification = (
  verification: CustomPreRegisterVerification
) => {
  preRegisterCustomVerifications.push(verification);
};

/**
 * Register new post-register action
 */
export const registerPostRegisterAction = (
  action: CustomPostRegisterAction
) => {
  postRegisterActions.push(action);
};

/**
 * Define the payment routes
 */
export function definePublicUserRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Login endpoint
   */
  app.post(
    API_BASE_PATH + "/user/login",
    describeRoute({
      method: "post",
      path: "/user/login",
      tags: ["user"],
      summary: "Login endpoint",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  user: usersRestrictedSelectSchema,
                  token: v.string(),
                  redirectUrl: v.optional(v.string()),
                })
              ),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        email: v.string(),
        password: v.string(),
        magicLinkToken: v.optional(v.string()),
        redirectUrl: v.optional(v.string()),
      })
    ),
    async (c) => {
      try {
        if (_GLOBAL_SERVER_CONFIG.authType !== "local") {
          throw new HTTPException(400, {
            message: "Local login is not enabled",
          });
        }
        const data = c.req.valid("json");

        if (data.magicLinkToken) {
          const r = await LocalAuth.loginWithMagicLink(data.magicLinkToken);
          return c.json({ ...r, redirectUrl: data.redirectUrl });
        } else {
          const r = await LocalAuth.login(data.email, data.password);
          return c.json({ ...r, redirectUrl: data.redirectUrl });
        }
      } catch (err) {
        throw new HTTPException(401, { message: "Invalid login: " + err });
      }
    }
  );

  /**
   * Endpoint to send a magic link to the user
   */
  app.get(
    API_BASE_PATH + "/user/send-magic-link",
    describeRoute({
      method: "get",
      path: "/user/send-magic-link",
      tags: ["user"],
      summary: "Send a magic link to the user",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "query",
      v.object({
        email: v.string(),
      })
    ),
    async (c) => {
      const email = c.req.query("email");
      if (!email) {
        throw new HTTPException(400, { message: "?email=... is required" });
      }
      try {
        await LocalAuth.sendMagicLink(email);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error sending magic link: " + err,
        });
      }
    }
  );

  /**
   * Endpoint to send a verification email to the user
   */
  app.get(
    API_BASE_PATH + "/user/send-verification-email",
    describeRoute({
      method: "get",
      path: "/user/send-verification-email",
      tags: ["user"],
      summary: "Send a verification email to the user",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "query",
      v.object({
        email: v.string(),
      })
    ),
    async (c) => {
      const email = c.req.query("email");
      if (!email) {
        throw new HTTPException(400, { message: "?email=... is required" });
      }
      try {
        await LocalAuth.sendVerificationEmail(email);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error sending verification email: " + err,
        });
      }
    }
  );

  /**
   * Verify email endpoint
   */
  app.get(
    API_BASE_PATH + "/user/verify-email",
    describeRoute({
      method: "get",
      path: "/user/verify-email",
      tags: ["user"],
      summary: "Verify email endpoint",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "query",
      v.object({
        token: v.string(),
      })
    ),
    async (c) => {
      try {
        const { token } = c.req.valid("query");
        const r = await LocalAuth.verifyEmail(token);
        return c.json(r);
      } catch (err) {
        throw new HTTPException(401, { message: "Invalid token: " + err });
      }
    }
  );

  /**
   * Register endpoint
   */
  app.post(
    API_BASE_PATH + "/user/register",
    describeRoute({
      method: "post",
      path: "/user/register",
      tags: ["user"],
      summary: "Register endpoint",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(usersRestrictedSelectSchema),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        email: v.string(),
        password: v.string(),
        sendVerificationEmail: v.optional(v.boolean()),
        meta: v.optional(v.object({})),
      })
    ),
    async (c) => {
      try {
        if (_GLOBAL_SERVER_CONFIG.authType !== "local") {
          throw new HTTPException(400, {
            message: "Local register is not enabled",
          });
        }
        const data = c.req.valid("json");

        // go through all pre-register custom verifications
        for (const verification of preRegisterCustomVerifications) {
          const r = await verification(data.email, data.meta);
          if (!r.success) {
            throw new HTTPException(400, {
              message: "Custom verification failed: " + r.message,
            });
          }
        }

        const user = await LocalAuth.register(
          data.email,
          data.password,
          data.sendVerificationEmail ?? true
        );

        // go through all post-register actions
        for (const action of postRegisterActions) {
          await action(user.id, user.email);
        }

        log.debug(`User registered: ${user.id}`);
        return c.json({ ...user, password: undefined, salt: undefined });
      } catch (err) {
        log.error(err + "");
        throw new HTTPException(500, { message: err + "" });
      }
    }
  );

  /**
   * Forgot password endpoint
   */
  app.post(
    API_BASE_PATH + "/user/forgot-password",
    describeRoute({
      method: "post",
      path: "/user/forgot-password",
      tags: ["user"],
      summary: "Forgot password endpoint",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "json",
      v.object({
        email: v.string(),
      })
    ),
    async (c) => {
      const { email } = c.req.valid("json");
      await LocalAuth.forgotPasswort(email);
      return c.json(RESPONSES.SUCCESS);
    }
  );

  /**
   * Set new password with token
   */
  app.post(
    API_BASE_PATH + "/user/reset-password",
    describeRoute({
      method: "post",
      path: "/user/reset-password",
      tags: ["user"],
      summary: "Reset password with token",
      responses: {
        200: { description: "Successful response" },
      },
    }),
    validator(
      "json",
      v.object({
        token: v.string(),
        password: v.string(),
      })
    ),
    async (c) => {
      try {
        const { token, password } = c.req.valid("json");
        const { userId } = await verifyPasswordResetToken(token);

        await LocalAuth.setNewPassword(userId, password);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(401, { message: "Invalid token: " + err });
      }
    }
  );
}
