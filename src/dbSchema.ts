/**
 * Exposed db schema for the customer app
 */

import { pgTableCreator } from "drizzle-orm/pg-core";
import type { ServerPlugin } from "./lib/types/plugins";
import type { DatabaseSchema } from "./lib/db/db-schema";
import { getDb } from "./lib/db/db-connection";

export * from "./lib/db/db-schema";

export const pgAppTable = pgTableCreator((name) => `app_${name}`);

export { getDb };
export type { DatabaseSchema, ServerPlugin };
