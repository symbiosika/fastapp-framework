import type { Hono } from "hono";
import type { BlankSchema } from "hono/types";
import Logger from "./lib/log";
import type { PermissionDefinitionPerTable } from "./lib/types/permission-checker";
import type { JobHandlerRegister } from "./lib/jobs";

export type FastAppHonoContextVariables = {
  usersId: string;
  usersEmail: string;
  usersRoles: string[];
  logger: typeof Logger;
};

export interface FastAppHono
  extends Hono<{ Variables: FastAppHonoContextVariables }, BlankSchema, "/"> {}

export interface ServerConfig {
  port?: number;
  basePath?: string;
  baseUrl?: string;

  authType?: "local" | "auth0";
  jwtExpiresAfter?: number;

  jobHandlers?: JobHandlerRegister[];

  customEnvVariablesToCheckOnStartup?: string[];
  customHonoApps?: {
    baseRoute: string;
    app: (app: Hono<{ Variables: FastAppHonoContextVariables }>) => void;
  }[];
  customDbSchema?: any; // Drizzle Schema
  customCollectionPermissions?: PermissionDefinitionPerTable;
  staticPrivateDataPath?: string;
  staticPublicDataPath?: string;

  customPreRegisterCustomVerifications?: CustomPreRegisterVerification[];

  // stripe
  useStripe?: boolean;
}

export interface DBStandardData {
  name?: string;
  description?: string;
  schemaName: string;
  entries: any[];
}

export type CustomPreRegisterVerification = (
  email: string,
  meta: any
) => Promise<{ success: boolean; message?: string }>;
