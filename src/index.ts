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
import {
  addPromptTemplate,
  deletePromptTemplate,
  deletePromptTemplatePlaceholder,
  getPlaceholdersForPromptTemplate,
  getPlainPlaceholdersForPromptTemplate,
  updatePromptTemplate,
  updatePromptTemplatePlaceholder,
} from "./lib/ai/generation/crud";
import { useTemplateChat } from "./lib/ai/generation";
import { parseDocument } from "./lib/ai/parsing";
import {
  addKnowledgeFromUrl,
  addPlainKnowledgeText,
  extractKnowledgeFromText,
} from "./lib/ai/knowledge/add-knowledge";
import { getKnowledgeEntries } from "./lib/ai/knowledge/get-knowledge";
import {
  addFineTuningData,
  deleteFineTuningData,
  getFineTuningEntries,
  getFineTuningEntryById,
  updateFineTuningData,
} from "./lib/ai/fine-tuning";

export const _GLOBAL_SERVER_CONFIG = {
  appName: "App",
  port: 3000,
  basePath: "/api/v1/",
  baseUrl: "http://localhost:3000",
  allowedOrigins: <string[]>[],
  authType: <"local" | "auth0">"local",
  jwtExpiresAfter: 60 * 60 * 24 * 30, // 30 days
  useStripe: false,
};

const setGlobalServerConfig = (config: ServerConfig) => {
  _GLOBAL_SERVER_CONFIG.port = config.port ?? 3000;
  _GLOBAL_SERVER_CONFIG.basePath = config.basePath ?? "/api/v1";
  _GLOBAL_SERVER_CONFIG.baseUrl =
    config.baseUrl ?? process.env.BASE_URL ?? "http://localhost:3000";

  if (_GLOBAL_SERVER_CONFIG.basePath.endsWith("/")) {
    _GLOBAL_SERVER_CONFIG.basePath = _GLOBAL_SERVER_CONFIG.basePath.slice(
      0,
      -1
    );
  }

  const _ORIGINS_FROM_ENV = process.env.ALLOWED_ORIGINS;
  _GLOBAL_SERVER_CONFIG.allowedOrigins = _ORIGINS_FROM_ENV
    ? _ORIGINS_FROM_ENV.split(",")
    : [];

  _GLOBAL_SERVER_CONFIG.authType = config.authType ?? "local";

  if (config.jwtExpiresAfter) {
    _GLOBAL_SERVER_CONFIG.jwtExpiresAfter = config.jwtExpiresAfter;
  }

  _GLOBAL_SERVER_CONFIG.useStripe = config.useStripe ?? false;
};

export const defineServer = (config: ServerConfig) => {
  setGlobalServerConfig(config);

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
  console.log("Allowed origins:", _GLOBAL_SERVER_CONFIG.allowedOrigins);
  app.use(
    "/*",
    cors({
      origin: _GLOBAL_SERVER_CONFIG.allowedOrigins,
    })
  );

  /**
   * A Ping endpoint
   */
  app.get(_GLOBAL_SERVER_CONFIG.basePath + "/ping", async (c) => {
    const logger = c.get("logger");
    logger.info("Ping");
    return c.json({
      online: true,
    });
  });

  /**
   * Add user routes
   */
  definePublicUserRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);
  defineSecuredUserRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

  /**
   * Add collection routes
   */
  defineCollectionRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

  /**
   * Add files routes
   */
  defineFilesRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

  /**
   * Add payment routes
   */
  if (_GLOBAL_SERVER_CONFIG.useStripe) {
    const paymentApp = new Hono();
    paymentApp.use("*", async (c, next) => {
      if (c.req.path !== _GLOBAL_SERVER_CONFIG.basePath + "/payment/success") {
        return authAndSetUsersInfoOrRedirectToLogin(c, next);
      }
      await next();
    });
    paymentRoutes(paymentApp as any);
    app.route(_GLOBAL_SERVER_CONFIG.basePath + "/payment", paymentApp);
  }

  /**
   * Add all AI routes
   */
  const aiApp = new Hono();
  aiApp.use("*", authAndSetUsersInfoOrRedirectToLogin);
  aiRoutes(aiApp as any);
  app.route(_GLOBAL_SERVER_CONFIG.basePath + "/ai", aiApp);

  /**
   * Add custom routes from customHonoApps
   */
  if (config.customHonoApps) {
    config.customHonoApps.forEach(({ baseRoute, app: customApp }) => {
      const honoApp = new Hono<{ Variables: FastAppHonoContextVariables }>();
      // Add authOrRedirectToLogin middleware
      honoApp.use("*", authAndSetUsersInfoOrRedirectToLogin);
      customApp(honoApp);
      app.route(_GLOBAL_SERVER_CONFIG.basePath + baseRoute, honoApp);
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
    port: config.port ?? 3000,
    fetch: app.fetch,
  };
};

export const aiService = {
  // prompt templates
  addPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  getPlainPlaceholdersForPromptTemplate,
  updatePromptTemplatePlaceholder,
  deletePromptTemplatePlaceholder,
  getPlaceholdersForPromptTemplate,
  // chat
  useTemplateChat,
  // knowledge
  parseDocument,
  extractKnowledgeFromText,
  getKnowledgeEntries,
  addKnowledgeFromUrl,
  addPlainKnowledgeText,
  // fine-tuning
  getFineTuningEntryById,
  getFineTuningEntries,
  addFineTuningData,
  updateFineTuningData,
  deleteFineTuningData,
};

export { getDb };
export type { DatabaseSchema };
export { checkUserSubscription };
export type { JobHandlerRegister };
export * from "./types";
