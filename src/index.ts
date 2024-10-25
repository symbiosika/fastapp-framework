import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import {
  authAndSetUsersInfoOrRedirectToLogin,
  authOrRedirectToLogin,
  validateAllEnvVariables,
} from "./helper";
import { createDatabaseClient, getDb } from "./lib/db/db-connection";
import { initializeFullDbSchema } from "./lib/db/db-schema";
import { serveStatic } from "hono/bun";
import { defineFilesRoutes } from "./routes/files";
import paymentRoutes from "./routes/payment";
import aiRoutes from "./routes/ai";
import type { ServerConfig, FastAppHonoContextVariables } from "./types";
import { initializeCollectionPermissions } from "./lib/db/db-collections";
import type { DatabaseSchema } from "./lib/db/db-schema";
import log from "./lib/log";
import { checkUserSubscription } from "./routes/payment";
import {
  definePublicUserRoutes,
  defineSecuredUserRoutes,
  registerPreRegisterCustomVerification,
} from "./routes/user";
import { defineCollectionRoutes } from "./routes/collections";
import { defineJob, startJobQueue, type JobHandlerRegister } from "./lib/jobs";

/**
 * Get all relevant ENV variables
 */
const _PORTSTR = process.env.PORT!;
const PORT = parseInt(_PORTSTR);

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
   * Register custom pre-register verifications
   */
  if (config.customPreRegisterCustomVerifications) {
    config.customPreRegisterCustomVerifications.forEach((verification) => {
      registerPreRegisterCustomVerification(verification);
    });
  }

  /**
   * Middleware for CORS
   */
  console.log("Allowed origins:", ALLOWED_ORIGINS);
  app.use(
    "/*",
    cors({
      origin: ALLOWED_ORIGINS,
    })
  );

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
   * Add user routes
   */
  definePublicUserRoutes(app, BASE_PATH);
  defineSecuredUserRoutes(app, BASE_PATH);

  /**
   * Add collection routes
   */
  defineCollectionRoutes(app, BASE_PATH);

  /**
   * Add files routes
   */
  defineFilesRoutes(app, BASE_PATH);

  /**
   * Add payment routes
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
  aiApp.use("*", authAndSetUsersInfoOrRedirectToLogin);
  aiRoutes(aiApp as any);
  app.route(BASE_PATH + "/ai", aiApp);

  /**
   * Add custom routes from customHonoApps
   */
  if (config.customHonoApps) {
    config.customHonoApps.forEach(({ baseRoute, app: customApp }) => {
      const honoApp = new Hono<{ Variables: FastAppHonoContextVariables }>();
      // Add authOrRedirectToLogin middleware
      honoApp.use("*", authAndSetUsersInfoOrRedirectToLogin);
      customApp(honoApp);
      app.route(BASE_PATH + baseRoute, honoApp);
    });
  }

  /**
   * Serve all files from ./static/
   * can be images, html, css, js, etc.
   */
  const staticPrivateDataPath = config.staticPrivateDataPath ?? "./static";
  log.debug(`Static private data path:", ${staticPrivateDataPath}`);
  app.use(
    "/static/*",
    authOrRedirectToLogin,
    serveStatic({
      root: staticPrivateDataPath,
      rewriteRequestPath: (path) => path.replace(/^\/static/, "/"),
    })
  );

  /**
   * Serve all files from ./public/
   * can be images, html, css, js, etc.
   */
  const staticPublicDataPath = config.staticPublicDataPath ?? "./public";
  log.debug(`Static public data path: ${staticPublicDataPath}`);
  app.use(
    "/*",
    serveStatic({
      root: staticPublicDataPath,
      rewriteRequestPath: (path) => path.replace(/^\/public/, "/"),
    })
  );

  /**
   * Start job queue if needed
   */
  if (config.jobHandlers && config.jobHandlers.length > 0) {
    log.debug("Starting job queue...");
    startJobQueue();
    config.jobHandlers.forEach((jobHandler) => {
      log.debug(`Registering job handler: ${jobHandler.type}`);
      defineJob(jobHandler.type, jobHandler.handler);
    });
  }

  return {
    port: PORT,
    fetch: app.fetch,
  };
};

export { getDb };
export type { DatabaseSchema };
export { checkUserSubscription };
export type { JobHandlerRegister };
