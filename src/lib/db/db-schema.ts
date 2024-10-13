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

// export all tables for drizzle-kit
export * from "./schema/users";
export * from "./schema/secrets";
export * from "./schema/files";
export * from "./schema/embeddings";
export * from "./schema/payment";
export * from "./schema/additional-data";
export * from "./schema/prompts";

const baseDbSchema = {
  // auth tables
  ...userTables,
  // app wide secrets
  ...secrets,
  // files
  ...files,
  // embeddings
  ...embeddings,
  // payment
  ...payment,
  // additional data
  ...additionalData,
  // prompts
  ...prompts,
};

export const initializeFullDbSchema = (
  customSchema: Record<string, PgTableWithColumns<any>>
) => {
  Object.assign(baseDbSchema, customSchema);
  console.log("DB schema tables", Object.keys(baseDbSchema));
};

export const getDbSchema = () => {
  return baseDbSchema;
};

/**
 * Export the database schema and the valid table names.
 */
export type DatabaseSchema = typeof baseDbSchema;
