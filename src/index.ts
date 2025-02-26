// Hono
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import {
  authAndSetUsersInfoOrRedirectToLogin,
  authOrRedirectToLogin,
} from "./lib/utils/hono-middlewares";
// DB
import {
  createDatabaseClient,
  waitForDbConnection,
} from "./lib/db/db-connection";
import { initializeFullDbSchema, Job } from "./lib/db/db-schema";
import { initializeCollectionPermissions } from "./lib/db/db-collections";
// Types
import type {
  ServerSpecificConfig,
  FastAppHonoContextVariables,
} from "./types";
// Utils
import log from "./lib/log";
import { validateAllEnvVariables } from "./lib/utils/env-validate";
// Registration actions
import {
  registerPostRegisterAction,
  registerPreRegisterCustomVerification,
} from "./lib/auth/actions";
// Routes
import { definePublicUserRoutes } from "./routes/user/public";
import { defineSecuredUserRoutes } from "./routes/user/protected";
import { defineFilesRoutes } from "./routes/organisation/[organisationId]/files";
import paymentRoutes from "./routes/payment";
import aiTemplatesRoutes from "./routes/organisation/[organisationId]/ai/template";
import aiFineTuningRoutes from "./routes/organisation/[organisationId]/ai/fine-tuning";
import aiKnowledgeRoutes from "./routes/organisation/[organisationId]/ai/knowledge";
import aiChatRoutes from "./routes/organisation/[organisationId]/ai/chat";
import defineOrganisationRoutes from "./routes/organisation";
import defineTeamRoutes from "./routes/organisation/[organisationId]/teams";
import definePermissionGroupRoutes from "./routes/organisation/[organisationId]/permission-groups";
import defineInvitationRoutes from "./routes/organisation/[organisationId]/invitations";
// import { defineCollectionRoutes } from "./routes/collections";
import defineManageSecretsRoutes from "./routes/organisation/[organisationId]/secrets";
import definePluginRoutes from "./routes/organisation/[organisationId]/plugins";
import definePingRoute from "./routes/ping";
import defineWorkspaceRoutes from "./routes/organisation/[organisationId]/workspaces";
import defineWebhookRoutes from "./routes/organisation/[organisationId]/webhooks";
import defineChatGroupRoutes from "./routes/organisation/[organisationId]/ai/chat-groups";
import defineAdminRoutes from "./routes/admin";
import defineSearchInOrganisationRoutes from "./routes/organisation/[organisationId]/search";
import defineAiUtilsRoutes from "./routes/organisation/[organisationId]/ai/utils";

// Jobs
import { defineJob, startJobQueue } from "./lib/jobs";

import scheduler from "./lib/cron";
// Plugins
import { initializePluginCache } from "./lib/plugins";
// Store
import { _GLOBAL_SERVER_CONFIG, setGlobalServerConfig } from "./store";
// Utils
import { logApiRoutes } from "./lib/utils/log-api-routes";

/**
 * services
 */
import aiService from "./ai-service";
import specificDataService from "./specific-data-service";
import { smtpService } from "./lib/email";
import secretsService from "./secrets-service";
import urlService from "./url-service";
import pluginService from "./plugin-service";
import paymentService from "./payment-service";
import usermanagementService from "./usermanagement-service";
import filesService from "./files-service";
import middlewareService from "./middleware-service";
import jobService from "./job-service";
import { defineLicenseRoutes, licenseManager } from "./license-service";

/**
 * OpenAPI Docs
 */
import { swaggerUI } from "@hono/swagger-ui";
import { openAPISpecs } from "hono-openapi";
import widdershins from "widdershins";

/**
 * MAIN FUNCTION
 * Define the server and start it
 *
 * Will take a configuration from the App
 * and merge the config with the default values
 * and validate the .ENV variables
 * and create the database client
 * and register the cron jobs
 * and initialize the caches
 * and start the job queue
 * start the server
 */
export const defineServer = (config: ServerSpecificConfig) => {
  setGlobalServerConfig(config);
  console.log("Global server config:", JSON.stringify(_GLOBAL_SERVER_CONFIG));

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
   * Register all custom cron jobs
   */
  if (config.customCronJobs) {
    config.customCronJobs.forEach((cronJob) => {
      scheduler.registerTask(cronJob.name, cronJob.schedule, cronJob.handler);
    });
  }

  /**
   * Init the main Hono app
   */
  const app = new Hono<{ Variables: FastAppHonoContextVariables }>();
  app.use(logger());
  if (config.useConsoleLogger) {
    console.log("Using console logger");
    app.use(logger());
  }

  /**
   * Register custom pre-register verifications
   * These are used to verify something about the user before registering
   */
  if (config.customPreRegisterCustomVerifications) {
    config.customPreRegisterCustomVerifications.forEach((verification) => {
      registerPreRegisterCustomVerification(verification);
    });
  }

  /**
   * Register custom post-register actions
   * These are used to perform actions after the user has registered
   */
  if (config.customPostRegisterActions) {
    config.customPostRegisterActions.forEach((action) => {
      registerPostRegisterAction(action);
    });
  }

  /**
   * Adds CORS Middleware
   */
  console.log("Allowed origins:", _GLOBAL_SERVER_CONFIG.allowedOrigins);
  app.use(
    "/*",
    cors({
      origin: _GLOBAL_SERVER_CONFIG.allowedOrigins,
    })
  );

  /**
   * Licencing routes
   */
  defineLicenseRoutes(app);

  /**
   * Adds a ping endpoint to have a simple health check
   * and check if the server has external internet access
   */
  definePingRoute(app, _GLOBAL_SERVER_CONFIG.basePath);

  /**
   * Initialize internal caches after DB is connected
   */
  waitForDbConnection().then(async () => {
    licenseManager.init();
    initializePluginCache();

    const isLicenseValid = await licenseManager.isValid();

    if (_GLOBAL_SERVER_CONFIG.useLicenseSystem && isLicenseValid) {
      console.log("License check was valid! Starting server...");

      /**
       * Adds admin routes
       */
      defineAdminRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

      /**
       * Adds user routes for profile, register, login, logout, etc.
       */
      definePublicUserRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);
      defineSecuredUserRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

      /**
       * Adds organisation routes
       */
      defineOrganisationRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);
      defineTeamRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);
      definePermissionGroupRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);
      defineInvitationRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);
      defineSearchInOrganisationRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

      /**
   * Adds collection routes

   * will give simple CRUD endpoints for defined collections
   */
      // dropping this for now!
      // defineCollectionRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

      /**
       * Adds files routes
       * will give simple CRUD endpoints to store and retrieve files from DB or S3
       */
      defineFilesRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

      /**
       * Adds routes to manage secrets
       * Secrets are used to store sensitive information like API keys, etc.
       */
      defineManageSecretsRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

      /**
       * Adds routes to manage plugins
       * Plugins are used to extend the functionality of the server
       * Plugins can sync data from external sources or provide new endpoints
       */
      definePluginRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

      /**
       * Adds routes to manage webhooks
       * Webhooks are used to trigger actions from external sources
       */
      defineWebhookRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

      /**
   * Adds payment routes if needed

   */
      if (_GLOBAL_SERVER_CONFIG.useStripe) {
        const paymentApp = new Hono();
        paymentApp.use("*", async (c, next) => {
          if (
            c.req.path !==
            _GLOBAL_SERVER_CONFIG.basePath + "/payment/success"
          ) {
            return authAndSetUsersInfoOrRedirectToLogin(c, next);
          }
          await next();
        });
        paymentRoutes(paymentApp as any);
        app.route(_GLOBAL_SERVER_CONFIG.basePath + "/payment", paymentApp);
      }

      /**
       * Adds all AI specific routes
       * - prompt templates
       * - fine-tuning
       * - knowledge
       * - chat
       */
      aiFineTuningRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);
      aiKnowledgeRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);
      aiChatRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);
      aiTemplatesRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);
      defineChatGroupRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);
      defineAiUtilsRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

      /**
       * Adds workspace routes
       * - workspaces
       * - workspace relations
       */
      defineWorkspaceRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

      /**
       * Adds custom routes from customHonoApps
       * These are used to add custom routes to the server
       * These are defined in the App config
       */
      if (config.customHonoApps) {
        config.customHonoApps.forEach(({ baseRoute, app: customApp }) => {
          const honoApp = new Hono<{
            Variables: FastAppHonoContextVariables;
          }>();
          // Add authOrRedirectToLogin middleware
          honoApp.use("*", authAndSetUsersInfoOrRedirectToLogin);
          customApp(honoApp);
          app.route(_GLOBAL_SERVER_CONFIG.basePath + baseRoute, honoApp);
        });
      }

      /**
       * Adds static private data routes
       * folder ./static/
       * will be served only to authenticated users
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
       * Adds static public data routes
       * folder ./public/
       * will be served to all users without authentication
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

      // OpenAPI Docs
      app.get(
        "/api/v1/openapi",
        openAPISpecs(app, {
          documentation: {
            info: {
              title: "Symbiosika Backend API",
              version: "1.0.0",
              description: "API for the Symbiosika AI Backend",
            },
          },
        })
      );
      app.get("/api/v1/ui", swaggerUI({ url: "/api/v1/openapi" }));

      // Add Markdown export endpoint
      app.get("/api/v1/docs.md", async (c, next) => {
        const spec = await openAPISpecs(app, {
          documentation: {
            info: {
              title: "Symbiosika Backend API",
              version: "1.0.0",
              description: "API for the Symbiosika AI Backend",
            },
          },
        })(c, next);

        const options = {
          language_tabs: [
            { javascript: "JavaScript", typescript: "TypeScript" },
          ],
          summary: true,
          tocSummary: true,
        };

        const markdown = await widdershins.convert(await spec!.json(), options);
        return c.text(markdown);
      });

      /**
       * Start job queue if needed
       * These are used to perform background tasks
       */
      if (config.jobHandlers && config.jobHandlers.length > 0) {
        log.debug("Starting job queue...");
        config.jobHandlers.forEach((jobHandler) => {
          log.debug(`Registering job handler: ${jobHandler.type}`);
          defineJob(jobHandler.type, jobHandler.handler);
        });
        startJobQueue();
      }
    } else {
      console.log("License check was invalid! Please check your license key.");
    }
  });

  // Log all registered endpoints
  // logApiRoutes(app);

  return {
    idleTimeout: 255,
    port: config.port ?? 3000,
    fetch: app.fetch,
  };
};

/**
 * Export all needed types for the customer App
 */
export * from "./types";

/**
 * Export all services for the customer App
 */
export { log };
export { aiService };
export { smtpService };
export { specificDataService };
export { secretsService };
export { urlService };
export { pluginService };
export { paymentService };
export { usermanagementService };
export { filesService };
export { middlewareService };
export { jobService };
export const GLOBAL_SERVER_CONFIG = _GLOBAL_SERVER_CONFIG;
