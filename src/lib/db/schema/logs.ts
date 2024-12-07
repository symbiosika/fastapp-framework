import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  timestamp,
  uuid,
  varchar,
  integer,
  pgEnum,
  text,
} from "drizzle-orm/pg-core";
import { pgBaseTable } from ".";

// Enum for the type of file source
export const logLevelEnum = pgEnum("log_level", [
  "debug",
  "info",
  "warn",
  "error",
]);

export const appLogs = pgBaseTable(
  "app_logs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    level: logLevelEnum("level").notNull(),
    source: varchar("source", { length: 100 }).notNull(), // Application component or service name
    category: varchar("category", { length: 50 }).notNull(), // e.g., 'security', 'performance', 'user-action'
    sessionId: uuid("session_id"), // Optional a session id. For debugging sessions
    message: text("message").notNull(),
    metadata: jsonb("metadata").default("{}"), // Additional structured data
    version: integer("version").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    levelIdx: index("app_logs_level_idx").on(table.level),
    categoryIdx: index("app_logs_category_idx").on(table.category),
    sourceIdx: index("app_logs_source_idx").on(table.source),
    createdAtIdx: index("app_logs_created_at_idx").on(table.createdAt),
    versionIdx: index("app_logs_version_idx").on(table.version),
  })
);

export type AppLogsSelect = typeof appLogs.$inferSelect;
export type AppLogsInsert = typeof appLogs.$inferInsert;
