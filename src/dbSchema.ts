/**
 * Exposed db schema for the customer app
 */

import { pgTableCreator } from "drizzle-orm/pg-core";
import type { ServerPlugin } from "./lib/types/plugins";
import type { DatabaseSchema } from "./lib/db/db-schema";
import {
  getDb,
  createDatabaseClient,
  waitForDbConnection,
} from "./lib/db/db-connection";

export * from "./lib/db/db-schema";

export const pgAppTable = pgTableCreator((name) => `app_${name}`);

export { getDb, createDatabaseClient, waitForDbConnection };
export type { DatabaseSchema, ServerPlugin };
