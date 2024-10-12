import { Hono, type Context } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import {
  attachLogger,
  authAndSetUsersInfo,
  authAndSetUsersInfoOrRedirectToLogin,
  authOrRedirectToLogin,
  validateAllEnvVariables,
} from "./helper";
import { HTTPException } from "hono/http-exception";
import { createDatabaseClient, getDb } from "./lib/db/db-connection";
import { initializeFullDbSchema, users } from "./lib/db/db-schema";
import { eq } from "drizzle-orm";
import { LocalAuth } from "./lib/auth";
import { serveStatic } from "hono/bun";
import FileHander from "./routes/files";
import { getCollection, postCollection } from "./routes/collections/[name]";
import {
  deleteCollectionById,
  getCollectionById,
  putCollectionById,
} from "./routes/collections/[name]/[id]";
import paymentRoutes from "./routes/payment";
import aiRoutes from "./routes/ai";
import type { ServerConfig, FastAppHonoContextVariables } from "./types";
import { initializeCollectionPermissions } from "./lib/db/db-collections";
import type { DatabaseSchema } from "./lib/db/db-schema";

/**
 * Get all relevant ENV variables
 */
const _PORTSTR = process.env.PORT!;
const PORT = parseInt(_PORTSTR);
const AUTH_TYPE: "local" | "auth0" = (process.env.AUTH_TYPE as any) || "local";
const _ORIGINS_FROM_ENV = process.env.ALLOWED_ORIGINS;
const ALLOWED_ORIGINS = _ORIGINS_FROM_ENV ? _ORIGINS_FROM_ENV.split(",") : [];
let BASE_PATH = process.env.BASE_PATH || "/api/v1/";
if (BASE_PATH.endsWith("/")) {
  BASE_PATH = BASE_PATH.slice(0, -1);
}

export const defineServer = (config: ServerConfig) => {
  /**
   * validate .ENV variables
   */
  validateAllEnvVariables(config.customEnvVariablesToCheckOnStartup ?? []);

  /**
   * Create database client
   */
  initializeFullDbSchema(config.customDbSchema ?? {});
  initializeCollectionPermissions(config.customCollectionPermissions ?? {});
  createDatabaseClient(config.customDbSchema);

  /**
   * Init main Hono app
   */
  const app = new Hono<{ Variables: FastAppHonoContextVariables }>();
  app.use(logger());

  /**
   * Attach logger
   */
  app.use(attachLogger);

  /**
   * CORS configuration
   */

  console.log("Allowed origins:", ALLOWED_ORIGINS);

  /**
   * Middleware for CORS
   */
  app.use(
    "/*",
    cors({
      origin: ALLOWED_ORIGINS,
    })
  );

  // Hono can´t handle Auth0 JWT tokens
  // https://github.com/honojs/hono/issues/672

  /**
   * A Ping endpoint
   */
  app.get(BASE_PATH + "/ping", async (c) => {
    const logger = c.get("logger");
    logger.info("Ping");
    return c.json({
      online: true,
    });
  });

  /**
   * Get the own user
   */
  app.get(BASE_PATH + "/user/me", authAndSetUsersInfo, async (c: Context) => {
    // check if id is set
    const id = c.get("usersId");
    const user = await getDb()
      .select({
        userId: users.id,
        email: users.email,
        firstname: users.firstname,
        surname: users.surname,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, id));

    if (!user || user.length === 0) {
      throw new HTTPException(404, { message: "User not found" });
    } else {
      return c.json(user[0]);
    }
  });

  /**
   * Update the own user
   */
  app.put(BASE_PATH + "/user/me", authAndSetUsersInfo, async (c: Context) => {
    const { firstname, surname, image } = await c.req.json();
    const user = await getDb()
      .update(users)
      .set({ firstname, surname, image })
      .where(eq(users.id, c.get("usersId")))
      .returning();
    return c.json(user);
  });

  /**
   * Search for users by email address
   */
  app.get(
    BASE_PATH + "/user/search",
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

  /**
   * Login endpoint
   */
  app.post(BASE_PATH + "/login", async (c: Context) => {
    try {
      if (AUTH_TYPE !== "local") {
        throw new HTTPException(400, { message: "Local login is not enabled" });
      }
      const body = await c.req.json();
      const email = body.email;
      const password = body.password;
      const r = await LocalAuth.login(email, password);
      return c.json(r);
    } catch (err) {
      throw new HTTPException(401, { message: "Invalid login: " + err });
    }
  });

  /**
   * Register endpoint
   */
  app.post(BASE_PATH + "/register", async (c: Context) => {
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
      return c.json(user);
    } catch (err) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }
  });

  /**
   * Collections endpoint
   */
  app.all(
    BASE_PATH + "/db/collections/:name/:id?",
    authAndSetUsersInfo,
    async (c: Context) => {
      // check if id is set
      const id = c.req.param("id");
      if (!id) {
        if (c.req.method === "GET") {
          return getCollection(c);
        } else if (c.req.method === "POST") {
          return postCollection(c);
        } else {
          throw new HTTPException(405, { message: "Method not allowed" });
        }
      } else {
        if (c.req.method === "GET") {
          return getCollectionById(c);
        } else if (c.req.method === "PUT") {
          return putCollectionById(c);
        } else if (c.req.method === "DELETE") {
          return deleteCollectionById(c);
        } else {
          throw new HTTPException(405, { message: "Method not allowed" });
        }
      }
    }
  );

  /**
   * Save and serve files that are stored in the database
   */
  app.all(
    BASE_PATH + "/files/:type/:bucket/:id?",
    authAndSetUsersInfo,
    async (c: Context) => {
      // check if id is set
      const id = c.req.param("id");
      const type = c.req.param("type");

      if (type !== "local" && type !== "db") {
        throw new HTTPException(400, { message: "Invalid type" });
      }

      if (!id) {
        if (c.req.method === "POST") {
          return FileHander.postFile(c, type);
        } else {
          throw new HTTPException(405, { message: "Method not allowed" });
        }
      } else {
        if (c.req.method === "GET") {
          return FileHander.getFile(c, type);
        } else if (c.req.method === "DELETE") {
          return FileHander.deleteFile(c, type);
        } else {
          throw new HTTPException(405, { message: "Method not allowed" });
        }
      }
    }
  );

  /**
   * Add all payment routes
   */
  if (process.env.USE_STRIPE === "true") {
    const paymentApp = new Hono();
    paymentApp.use("*", async (c, next) => {
      if (c.req.path !== BASE_PATH + "/payment/success") {
        return authAndSetUsersInfoOrRedirectToLogin(c, next);
      }
      await next();
    });
    paymentRoutes(paymentApp as any);
    app.route(BASE_PATH + "/payment", paymentApp);
  }

  /**
   * Add all AI routes
   */
  const aiApp = new Hono();
  aiApp.use("*", async (c, next) => {
    await next();
  });
  aiRoutes(aiApp as any);
  app.route(BASE_PATH + "/ai", aiApp);

  /**
   * Add custom routes from customHonoApps
   */
  if (config.customHonoApps) {
    config.customHonoApps.forEach(({ baseRoute, app: customApp }) => {
      const honoApp = new Hono<{ Variables: FastAppHonoContextVariables }>();
      // Add authOrRedirectToLogin middleware
      honoApp.use("*", authOrRedirectToLogin);
      customApp(honoApp);
      app.route(BASE_PATH + baseRoute, honoApp);
    });
  }

  /**
   * Serve all files from ./static/
   * can be images, html, css, js, etc.
   */
  app.use(
    "/static/*",
    authOrRedirectToLogin,
    serveStatic({
      root: "./static",
      rewriteRequestPath: (path) => path.replace(/^\/static/, "/"),
    })
  );

  /**
   * Serve all files from ./public/
   * can be images, html, css, js, etc.
   */
  app.use(
    "/*",
    serveStatic({
      root: "./public",
      rewriteRequestPath: (path) => path.replace(/^\/public/, "/"),
    })
  );

  return {
    port: PORT,
    fetch: app.fetch,
  };
};

export { getDb };
export type { DatabaseSchema };
