import type { ServerConfig } from "../types";

/**
 * The global server config object
 */
export const _GLOBAL_SERVER_CONFIG = {
  appName: "App",
  port: 3000,
  basePath: "/api/v1/",
  baseUrl: "http://localhost:3000",
  allowedOrigins: <string[]>[],
  authType: <"local" | "auth0">"local",
  jwtExpiresAfter: 60 * 60 * 24 * 30, // 30 days
  useStripe: false,
  useConsoleLogger: true,
};

/**
 * Helper function to set the global server config
 * and replace the default values with the ones from the config
 */
export const setGlobalServerConfig = (config: ServerConfig) => {
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
