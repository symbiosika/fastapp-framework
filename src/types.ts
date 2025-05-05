/**
 * Exposed types for the customer app
 */

export type * from "./lib/db/schema/users";
export type * from "./lib/db/schema/secrets";
export type * from "./lib/db/schema/files";
export type * from "./lib/db/schema/embeddings";
export type * from "./lib/db/schema/payment";
export type * from "./lib/db/schema/additional-data";
export type * from "./lib/db/schema/prompts";
export type * from "./lib/db/schema/knowledge";
export type * from "./lib/db/schema/jobs";
export type * from "./lib/db/schema/plugins";
export type * from "./lib/db/schema/chat";
export type * from "./lib/db/schema/logs";
export type * from "./lib/db/schema/workspaces";
export type * from "./lib/db/schema/webhooks";
export type * from "./lib/db/schema/server";

export type * from "./lib/types/openai";
export type * from "./lib/ai/ai-sdk/types";
export type * from "./lib/ai/ai-sdk/index";
export type * from "./lib/ai/chat-store";
export type * from "./lib/ai/interaction/index";

import type { Hono } from "hono";
import type { BlankSchema } from "hono/types";
import type { PermissionDefinitionPerTable } from "./lib/types/permission-checker";
import type { JobHandlerRegister } from "./lib/jobs";
import type { Task } from "./lib/cron";
import type { SyncItem } from "./lib/types/sync";
import type { StaticTemplateImport } from "./lib/ai/prompt-templates/static-templates";
import type { ProcessedWhatsAppMessage } from "./lib/communication/whatsapp";

export type { SyncItem };
export type { JobHandlerRegister };
export { HTTPException } from "hono/http-exception";
export type { ProcessedWhatsAppMessage };

export type FastAppHonoContextVariables = {
  usersId: string;
  usersEmail: string;
  usersRoles: string[];
  scopes: string[];
};

export interface FastAppHono
  extends Hono<{ Variables: FastAppHonoContextVariables }, BlankSchema, "/"> {}

type UserInfo = {
  firstname: string;
  surname: string;
  email: string;
};

export type EmailTemplateFunction = (data: {
  appName: string;
  baseUrl: string;
  link?: string;
  user?: UserInfo;
  organisation?: {
    id: string;
    name: string;
  };
}) => Promise<{ html: string; subject: string }>;

export type WhatsAppIncomingWebhookHandler = (
  messages: ProcessedWhatsAppMessage[]
) => Promise<void>;

export interface ServerSpecificConfig {
  port?: number;
  appName?: string;
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

  // Licencing
  useLicenseSystem?: boolean;
  publicKey?: string;

  // WhatsApp
  useWhatsApp?: boolean;
  whatsAppIncomingWebhookHandler?: WhatsAppIncomingWebhookHandler;

  // Static Templates
  staticTemplates?: StaticTemplateImport[];

  // Email Templates
  emailTemplates?: {
    verifyEmail?: EmailTemplateFunction;
    magicLink?: EmailTemplateFunction;
    resetPassword?: EmailTemplateFunction;
    resetPasswordWelcome?: EmailTemplateFunction;
    inviteToOrganization?: EmailTemplateFunction;
    inviteToOrganizationWhenUserExists?: EmailTemplateFunction;
  };
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

// export type RenderTypeForm = {
//   type: "form";
//   definition: GenericFormEntry[];
//   data: { [key: string]: any };
// };

export type RenderType =
  | RenderTypeText
  | RenderTypeImage
  | RenderTypeBox
  | RenderTypeMarkdown;
// | RenderTypeForm;

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
