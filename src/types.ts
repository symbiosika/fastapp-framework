/**
 * Exposed types for the customer app
 */

import type { Hono } from "hono";
import type { BlankSchema } from "hono/types";
import Logger from "./lib/log";
import type { PermissionDefinitionPerTable } from "./lib/types/permission-checker";
import type { JobHandlerRegister } from "./lib/jobs";
import type { GenericFormEntry } from "./lib/ai/smart-chat/shared-types";
import type { Task } from "./lib/cron";
import type { SyncItem } from "./lib/types/sync";

export type { SyncItem };
export type { JobHandlerRegister };
export { HTTPException } from "hono/http-exception";

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

  // Registration Flow
  customPreRegisterCustomVerifications?: CustomPreRegisterVerification[];
  customPostRegisterActions?: CustomPostRegisterAction[];

  // CRON
  customCronJobs?: Task[];

  // stripe
  useStripe?: boolean;

  // logging in console (hono logger)
  useConsoleLogger?: boolean;
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

export type CustomPostRegisterAction = (
  userId: string,
  email: string
) => Promise<void>;

export type RenderTypeText = {
  type: "text";
};

export type RenderTypeImage = {
  type: "image";
  url: string;
};

export type RenderTypeBox = {
  type: "box";
  severity: "info" | "warning" | "error";
};

export type RenderTypeMarkdown = {
  type: "markdown";
};

export type RenderTypeForm = {
  type: "form";
  definition: GenericFormEntry[];
  data: { [key: string]: any };
};

export type RenderType =
  | RenderTypeText
  | RenderTypeImage
  | RenderTypeBox
  | RenderTypeMarkdown
  | RenderTypeForm;

export type ChatWithTemplateReturn = {
  chatId: string;
  message: {
    role: "user" | "assistant";
    content: string;
  };
  meta: any;
  finished?: boolean;
  render?: RenderType;
};
