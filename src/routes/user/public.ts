/**
 * Routes to register and login a user.
 * These routes are not secured and public.
 */
import type { FastAppHono } from "../../types";
import { HTTPException } from "hono/http-exception";
import { LocalAuth } from "../../lib/auth";
import log from "../../lib/log";
import { _GLOBAL_SERVER_CONFIG } from "../../store";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from "valibot";
import { usersRestrictedSelectSchema } from "../../dbSchema";
import { RESPONSES } from "../../lib/responses";
import { verifyPasswordResetToken } from "../../lib/auth/magic-link";
import { checkIfInvitationCodeIsNeededToRegister } from "../../lib/usermanagement/invitations";
import { verifyApiTokenAndGetJwt } from "../../lib/auth/token-auth";

/**
 * Define the payment routes
 */
export function definePublicUserRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Check if an invitation code is needed to register
   */
  app.get(
    API_BASE_PATH + "/user/invitation-code-needed",
    describeRoute({
      method: "get",
      path: "/user/invitation-code-needed",
      tags: ["user"],
      summary: "Check if an invitation code is needed to register",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: v.object({
                invitationCodeNeeded: v.boolean(),
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const invitationCodeNeeded =
          await checkIfInvitationCodeIsNeededToRegister();
        return c.json({ invitationCodeNeeded });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error checking if invitation code is needed: " + err,
        });
      }
    }
  );

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
    validator(
      "query",
      v.object({
        sendVerificationEmail: v.optional(v.string()), // defaults to true
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
        let sendVerificationEmail = c.req.query("sendVerificationEmail")
          ? c.req.query("sendVerificationEmail") === "true"
          : true;

        if (data.magicLinkToken) {
          const r = await LocalAuth.loginWithMagicLink(data.magicLinkToken);
          return c.json({ ...r, redirectUrl: data.redirectUrl });
        } else {
          const r = await LocalAuth.login(data.email, data.password, sendVerificationEmail);
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
        meta: v.optional(v.any()),
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
        const user = await LocalAuth.register(
          data.email,
          data.password,
          data.sendVerificationEmail ?? true,
          data.meta ?? {}
        );
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
    validator(
      "query",
      v.object({
        type: v.optional(v.string()),
      })
    ),
    async (c) => {
      try {
        const { email } = c.req.valid("json");
        const { type } = c.req.valid("query");

        const welcomeText = type && type === "welcome" ? true : false;

        await LocalAuth.forgotPasswort(email, welcomeText);
        return c.json(RESPONSES.SUCCESS);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error sending forgot password email: " + err,
        });
      }
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

  /**
   * API Token Exchange endpoint
   * Allows exchanging a long-lived API token for a short-lived JWT with specific scopes
   */
  app.post(
    API_BASE_PATH + "/user/token-exchange",
    describeRoute({
      method: "post",
      path: "/user/token-exchange",
      tags: ["user"],
      summary: "Exchange API token for a short-lived JWT",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: v.object({
                token: v.string(),
                expiresAt: v.string(),
              }),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        token: v.string(),
        scopes: v.optional(v.array(v.string())),
      })
    ),
    async (c) => {
      try {
        const { token, scopes } = c.req.valid("json");
        const jwt = await verifyApiTokenAndGetJwt(token, scopes);

        return c.json({
          token: jwt.token,
          expiresAt: jwt.expiresAt.toISOString(),
        });
      } catch (err) {
        throw new HTTPException(401, {
          message: err + "",
        });
      }
    }
  );
}
