import type { PgTableWithColumns } from "drizzle-orm/pg-core";
/**
 * Main Schema for the database
 */
import * as userTables from "./schema/users";
import * as secrets from "./schema/secrets";
import * as files from "./schema/files";
import * as embeddings from "./schema/embeddings";
import * as payment from "./schema/payment";
import * as additionalData from "./schema/additional-data";
import * as prompts from "./schema/prompts";
import * as knowledge from "./schema/knowledge";
import * as jobs from "./schema/jobs";
import * as plugins from "./schema/plugins";
import * as chat from "./schema/chat";
import * as logs from "./schema/logs";
import * as workspaces from "./schema/workspaces";
import * as webhooks from "./schema/webhooks";
import * as server from "./schema/server";
import * as models from "./schema/models";
import * as apiTokens from "./schema/api-tokens";
import * as avatars from "./schema/avatars";
import * as mcp from "./schema/mcp";

// export all tables for drizzle-kit
export * from "./schema/users";
export * from "./schema/secrets";
export * from "./schema/files";
export * from "./schema/embeddings";
export * from "./schema/payment";
export * from "./schema/additional-data";
export * from "./schema/prompts";
export * from "./schema/knowledge";
export * from "./schema/jobs";
export * from "./schema/plugins";
export * from "./schema/chat";
export * from "./schema/logs";
export * from "./schema/workspaces";
export * from "./schema/webhooks";
export * from "./schema/server";
export * from "./schema/models";
export * from "./schema/api-tokens";
export * from "./schema/avatars";
export * from "./schema/mcp";

const baseDbSchema = {
  ...userTables,
  ...secrets,
  ...files,
  ...embeddings,
  ...payment,
  ...additionalData,
  ...prompts,
  ...knowledge,
  ...jobs,
  ...plugins,
  ...chat,
  ...logs,
  ...workspaces,
  ...webhooks,
  ...server,
  ...models,
  ...apiTokens,
  ...avatars,
  ...mcp,
};

let validTableNames: string[] = [];

export const initializeFullDbSchema = (
  customSchema: Record<string, PgTableWithColumns<any>>
) => {
  Object.assign(baseDbSchema, customSchema);
  console.log("DB schema tables", Object.keys(baseDbSchema));
  validTableNames = Object.keys(baseDbSchema);
};

export const getValidDbSchemaTableNames = () => {
  return validTableNames;
};

export const getDbSchema = () => {
  return baseDbSchema;
};

/**
 * Export the database schema and the valid table names.
 */
export type DatabaseSchema = typeof baseDbSchema;
