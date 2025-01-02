import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import {
  authAndSetUsersInfo,
  authAndSetUsersInfoOrRedirectToLogin,
  authOrRedirectToLogin,
  checkUserPermission,
  validateAllEnvVariables,
} from "./helper";
import {
  createDatabaseClient,
  getDb,
  waitForDbConnection,
} from "./lib/db/db-connection";
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
  registerPostRegisterAction,
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
import { extractKnowledgeFromExistingDbEntry } from "./lib/ai/knowledge/add-knowledge";
import { getKnowledgeEntries } from "./lib/ai/knowledge/get-knowledge";
import {
  addFineTuningData,
  deleteFineTuningData,
  getFineTuningEntries,
  getFineTuningEntryById,
  updateFineTuningData,
} from "./lib/ai/fine-tuning";
import {
  parseCommaSeparatedListFromUrlParam,
  parseNumberFromUrlParam,
} from "./lib/url";
import {
  getFullSourceDocumentsForSimilaritySearch,
  getNearestEmbeddings,
} from "./lib/ai/knowledge/similarity-search";
import { deleteSecret, getSecret, setSecret } from "./lib/crypt";
import defineManageSecretsRoutes from "./routes/secrets";
import scheduler from "./lib/cron";
import { initializePluginCache, registerServerPlugin } from "./lib/plugins";
import type { ServerPlugin } from "./lib/types/plugins";
import {
  addKnowledgeFromUrl,
  addPlainKnowledgeText,
} from "./lib/ai/knowledge-texts";
import { syncKnowledgeFromPlugin } from "./lib/ai/knowledge-sync/sync";
import type { SyncItem } from "./lib/types/sync";
import definePluginRoutes from "./routes/plugins";
import {
  addUserToOrganisation,
  addUserToTeam,
  getUser,
  getUserByEmail,
  getUserById,
  getUserOrganisations,
  getUserTeams,
  removeUserFromOrganisation,
  removeUserFromTeam,
  updateUser,
} from "./lib/db/usermanagement/user";
import {
  addTeamMember,
  assignPermissionToGroup,
  createOrganisation,
  createPathPermission,
  createPermissionGroup,
  createTeam,
  deleteOrganisation,
  deletePathPermission,
  deletePermissionGroup,
  deleteTeam,
  getLastOrganisation,
  getOrganisation,
  getPathPermission,
  getPermissionGroup,
  getPermissionGroupsByOrganisation,
  getPermissionsByOrganisation,
  getTeam,
  getTeamsAndMembersByOrganisation,
  getTeamsByOrganisation,
  removePermissionFromGroup,
  removeTeamMember,
  setLastOrganisation,
  updateOrganisation,
  updatePathPermission,
  updatePermissionGroup,
  updateTeam,
} from "./lib/db/usermanagement/oganisations-and-teams";
import {
  acceptAllPendingInvitationsForUser,
  acceptOrganisationInvitation,
  createOrganisationInvitation,
  declineOrganisationInvitation,
  getAllOrganisationInvitations,
} from "./lib/db/usermanagement/invitations";

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
   * Register custom cron jobs
   */
  if (config.customCronJobs) {
    config.customCronJobs.forEach((cronJob) => {
      scheduler.registerTask(cronJob.name, cronJob.schedule, cronJob.handler);
    });
  }

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
   * Register custom post-register actions
   */
  if (config.customPostRegisterActions) {
    config.customPostRegisterActions.forEach((action) => {
      registerPostRegisterAction(action);
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
  app.get(
    _GLOBAL_SERVER_CONFIG.basePath + "/ping",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      let canConnectToInternet = false;
      try {
        const response = await fetch("https://www.github.com");
        canConnectToInternet = response.ok;
      } catch (error) {
        canConnectToInternet = false;
      }

      return c.json({
        online: true,
        canConnectToInternet,
      });
    }
  );

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
   * Add routes to manage internal secrets
   */
  defineManageSecretsRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

  /**
   * Add routes to manage plugins
   */
  definePluginRoutes(app, _GLOBAL_SERVER_CONFIG.basePath);

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

  /**
   * Initialize caches after DB is connected
   */
  waitForDbConnection().then(() => {
    initializePluginCache();
  });

  return {
    idleTimeout: 120,
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
  extractKnowledgeFromExistingDbEntry,
  getKnowledgeEntries,
  addKnowledgeFromUrl,
  addPlainKnowledgeText,
  getNearestEmbeddings,
  getFullSourceDocumentsForSimilaritySearch,
  // fine-tuning
  getFineTuningEntryById,
  getFineTuningEntries,
  addFineTuningData,
  updateFineTuningData,
  deleteFineTuningData,
};

export const urlQueryParser = {
  parseNumberFromUrlParam,
  parseCommaSeparatedListFromUrlParam,
};

export const secretHandler = {
  setSecret,
  getSecret,
  deleteSecret,
};

export { getDb };
export type { DatabaseSchema, ServerPlugin };
export { checkUserSubscription, registerServerPlugin };
export type { JobHandlerRegister };
export * from "./types";
export { HTTPException } from "hono/http-exception";
export { log };
export { syncKnowledgeFromPlugin };
export type { SyncItem };

export const userManagement = {
  getUser,
  getUserById,
  getUserByEmail,
  updateUser,
  addUserToOrganisation,
  removeUserFromOrganisation,
  getUserTeams,
  addUserToTeam,
  removeUserFromTeam,
  getUserOrganisations,
  // organisations
  createOrganisation,
  getOrganisation,
  updateOrganisation,
  deleteOrganisation,
  // teams
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  getTeamsByOrganisation,
  addTeamMember,
  removeTeamMember,
  // permission groups
  createPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
  getPermissionGroup,
  getPermissionGroupsByOrganisation,
  // path permissions
  createPathPermission,
  getPathPermission,
  updatePathPermission,
  deletePathPermission,
  // invitations
  getAllOrganisationInvitations,
  acceptOrganisationInvitation,
  declineOrganisationInvitation,
  createOrganisationInvitation,
  acceptAllPendingInvitationsForUser,
  assignPermissionToGroup,
  removePermissionFromGroup,
  getLastOrganisation,
  setLastOrganisation,
  getTeamsAndMembersByOrganisation,
  getPermissionsByOrganisation,
};
