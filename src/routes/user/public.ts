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
import type { Context } from "hono";
import { LocalAuth } from "../../lib/auth";
import log from "../../lib/log";
import { _GLOBAL_SERVER_CONFIG } from "../../store";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import * as v from "valibot";

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
      summary: "Login endpoint",
      responses: {
        200: { description: "Successful response" },
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
    async (c: Context) => {
      try {
        if (_GLOBAL_SERVER_CONFIG.authType !== "local") {
          throw new HTTPException(400, {
            message: "Local login is not enabled",
          });
        }
        const body = await c.req.json();
        const email = body.email;
        const password = body.password;
        const magicLinkToken = body.magicLinkToken;
        const redirectUrl = body.redirectUrl;

        if (magicLinkToken) {
          const r = await LocalAuth.loginWithMagicLink(magicLinkToken);
          return c.json({ ...r, redirectUrl });
        } else {
          const r = await LocalAuth.login(email, password);
          return c.json({ ...r, redirectUrl });
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
    async (c: Context) => {
      const email = c.req.query("email");
      if (!email) {
        throw new HTTPException(400, { message: "?email=... is required" });
      }
      try {
        await LocalAuth.sendMagicLink(email);
        return c.json({
          success: true,
        });
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
    async (c: Context) => {
      const email = c.req.query("email");
      if (!email) {
        throw new HTTPException(400, { message: "?email=... is required" });
      }
      try {
        await LocalAuth.sendVerificationEmail(email);
        return c.json({
          success: true,
        });
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
    async (c: Context) => {
      const token = c.req.query("token");
      if (!token) {
        throw new HTTPException(400, { message: "?token=... is required" });
      }
      try {
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
      summary: "Register endpoint",
      responses: {
        200: { description: "Successful response" },
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
    async (c: Context) => {
      try {
        if (_GLOBAL_SERVER_CONFIG.authType !== "local") {
          throw new HTTPException(400, {
            message: "Local register is not enabled",
          });
        }
        const body = await c.req.json();
        const email = body.email;
        const password = body.password;
        const sendVerificationEmail: boolean =
          (body.sendVerificationEmail &&
            typeof body.sendVerificationEmail === "boolean") ??
          true;

        const meta = body.meta; // optional meta data for custom verifications

        // go through all pre-register custom verifications
        for (const verification of preRegisterCustomVerifications) {
          const r = await verification(email, meta);
          if (!r.success) {
            throw new HTTPException(400, {
              message: "Custom verification failed: " + r.message,
            });
          }
        }

        const user = await LocalAuth.register(
          email,
          password,
          sendVerificationEmail
        );

        // go through all post-register actions
        for (const action of postRegisterActions) {
          await action(user.id, user.email);
        }

        log.debug(`User registered: ${user.id}`);
        return c.json(user);
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
    async (c: Context) => {
      const body = await c.req.json();
      const email = body.email;
      // const r = await LocalAuth.forgotPassword(email);
      return c.json({
        success: true,
      });
    }
  );
}
