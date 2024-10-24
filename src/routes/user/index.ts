import type { FastAppHono } from "../../types";
import { HTTPException } from "hono/http-exception";
import { users } from "../../lib/db/db-schema";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { getDb } from "../../lib/db/db-connection";
import { LocalAuth } from "../../lib/auth";
import log from "../../lib/log";
import { authAndSetUsersInfo } from "../../helper";

const BASE_PATH = "/user";
const AUTH_TYPE: "local" | "auth0" = (process.env.AUTH_TYPE as any) || "local";

/**
 * Define the payment routes
 */
export function defineSecuredUserRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Get the own user
   */
  app.get(
    API_BASE_PATH + BASE_PATH + "/me",
    authAndSetUsersInfo,
    async (c: Context) => {
      // check if id is set
      const id = c.get("usersId");
      const user = await getDb()
        .select({
          userId: users.id,
          email: users.email,
          firstname: users.firstname,
          surname: users.surname,
          image: users.image,
          meta: users.meta,
        })
        .from(users)
        .where(eq(users.id, id));

      if (!user || user.length === 0) {
        throw new HTTPException(404, { message: "User not found" });
      } else {
        return c.json(user[0]);
      }
    }
  );

  /**
   * Update the own user
   */
  app.put(
    API_BASE_PATH + BASE_PATH + "/me",
    authAndSetUsersInfo,
    async (c: Context) => {
      const { firstname, surname, image } = await c.req.json();
      const user = await getDb()
        .update(users)
        .set({ firstname, surname, image })
        .where(eq(users.id, c.get("usersId")))
        .returning();
      return c.json(user);
    }
  );

  /**
   * Search for users by email address
   */
  app.get(
    API_BASE_PATH + BASE_PATH + "/search",
    authAndSetUsersInfo,
    async (c: Context) => {
      const email = c.req.query("email");
      if (!email) {
        throw new HTTPException(400, { message: "email is required" });
      }
      const u = await getDb()
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (!u || u.length === 0) {
        throw new HTTPException(404, { message: "User not found" });
      }
      return c.json({
        id: u[0].id,
        email: u[0].email,
        firstname: u[0].firstname,
        surname: u[0].surname,
      });
    }
  );
}

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
  app.post(API_BASE_PATH + BASE_PATH + "/login", async (c: Context) => {
    try {
      if (AUTH_TYPE !== "local") {
        throw new HTTPException(400, {
          message: "Local login is not enabled",
        });
      }
      const body = await c.req.json();
      const email = body.email;
      const password = body.password;
      const magicLinkToken = body.magicLinkToken;

      if (magicLinkToken) {
        const r = await LocalAuth.loginWithMagicLink(magicLinkToken);
        return c.json(r);
      } else {
        const r = await LocalAuth.login(email, password);
        return c.json(r);
      }
    } catch (err) {
      throw new HTTPException(401, { message: "Invalid login: " + err });
    }
  });

  /**
   * Endpoint to send a magic link to the user
   */
  app.get(
    API_BASE_PATH + BASE_PATH + "/send-magic-link",
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
    API_BASE_PATH + BASE_PATH + "/send-verification-email",
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
  app.get(API_BASE_PATH + BASE_PATH + "/verify-email", async (c: Context) => {
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
  });

  /**
   * Register endpoint
   */
  app.post(API_BASE_PATH + BASE_PATH + "/register", async (c: Context) => {
    try {
      if (AUTH_TYPE !== "local") {
        throw new HTTPException(400, {
          message: "Local register is not enabled",
        });
      }
      const body = await c.req.json();
      const email = body.email;
      const password = body.password;
      const user = await LocalAuth.register(email, password);
      log.debug(`User registered: ${user.id}`);
      return c.json(user);
    } catch (err) {
      log.error(err + "");
      throw new HTTPException(500, { message: err + "" });
    }
  });

  /**
   * Forgot password endpoint
   */
  app.post(
    API_BASE_PATH + BASE_PATH + "/forgot-password",
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
