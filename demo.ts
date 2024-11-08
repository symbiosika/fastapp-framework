import { defineServer } from "./src/index";

/**
 * SERVER
 */
const server = defineServer({
  port: 3099,
  basePath: "/api/v1",
  baseUrl: "http://localhost:3099",
  authType: "local",
  jwtExpiresAfter: 60 * 60 * 24 * 30, // 30 days
  jobHandlers: [],
  customEnvVariablesToCheckOnStartup: [],
  customHonoApps: [],
  customDbSchema: {},
  customCollectionPermissions: {},
  staticPrivateDataPath: "./static",
  staticPublicDataPath: "./public",
  customPreRegisterCustomVerifications: [],
  useStripe: false,
});

export default server;

console.log(`...server is running on port http://localhost:3099`);
