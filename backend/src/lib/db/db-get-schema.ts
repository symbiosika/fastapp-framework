import { getDb } from "./db-connection";
import { dbSchema, validTableNames, type DatabaseSchema } from "./db-schema";
import { customTables } from "./db-collections";

/**
 * check if a table name is valid and return it
 */
export function getDbSchemaTable<K extends keyof DatabaseSchema>(
  tableName: K
): DatabaseSchema[K] {
  if (!Object.keys(getDb().query).includes(tableName)) {
    throw new Error(`Cannot find table name in drizzle schema: ${tableName}`);
  } else {
    const key = tableName as keyof typeof dbSchema;
    const table = dbSchema[key];
    return table as DatabaseSchema[K];
  }
}

/**
 * Check if a table name is valid
 */
const isValidTablename = (name: string): boolean => {
  return validTableNames.includes(name) || customTables.includes(name);
};

/**
 * Returns the table name in a camelCase format
 */
export const normalizeTableName = (name: string): keyof DatabaseSchema => {
  // replace '-'-string to a camelCase string
  const tableName = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  if (!isValidTablename(tableName)) {
    throw new Error(`Invalid table name (normalized): ${name}`);
  }
  return tableName as keyof DatabaseSchema;
};
