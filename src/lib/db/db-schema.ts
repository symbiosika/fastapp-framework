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

// export all tables for drizzle-kit
export * from "./schema/users";
export * from "./schema/secrets";
export * from "./schema/files";
export * from "./schema/embeddings";
export * from "./schema/payment";
export * from "./schema/additional-data";
export * from "./schema/prompts";
export * from "./schema/knowledge";

const baseDbSchema = {
  ...userTables,
  ...secrets,
  ...files,
  ...embeddings,
  ...payment,
  ...additionalData,
  ...prompts,
  ...knowledge,
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
