import { sql } from "drizzle-orm";
import {
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { pgBaseTable } from ".";
import { organisations } from "./users";

// Plugins
export const plugins = pgBaseTable(
  "plugins",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organisationId: uuid("organisation_id")
      .references(() => organisations.id, {
        onDelete: "cascade",
      })
      .notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    pluginType: text("plugin_type").notNull(),
    version: integer("version").notNull(),
    meta: jsonb("meta").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (plugins) => [
    index("plugins_created_at_idx").on(plugins.createdAt),
    unique("plugins_name_idx").on(plugins.name),
  ]
);

export type PluginsSelect = typeof plugins.$inferSelect;
export type PluginsInsert = typeof plugins.$inferInsert;
export type PluginsUpdate = Partial<PluginsInsert>;
