import type { Hono } from "hono";
import type { BlankSchema } from "hono/types";
import Logger from "./lib/log";
import type { PermissionDefinitionPerTable } from "./lib/types/permission-checker";

export type FastAppHonoContextVariables = {
  usersId: string;
  usersEmail: string;
  usersRoles: string[];
  logger: typeof Logger;
};

export interface FastAppHono
  extends Hono<{ Variables: FastAppHonoContextVariables }, BlankSchema, "/"> {}

export interface ServerConfig {
  customEnvVariablesToCheckOnStartup?: string[];
  customHonoApps?: {
    baseRoute: string;
    app: (app: Hono<{ Variables: FastAppHonoContextVariables }>) => void;
  }[];
  customDbSchema?: any; // Drizzle Schema
  customCollectionPermissions?: PermissionDefinitionPerTable;
}

export interface DBStandardData {
  name?: string;
  description?: string;
  schemaName: string;
  entries: any[];
}
