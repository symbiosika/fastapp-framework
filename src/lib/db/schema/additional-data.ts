import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { pgBaseTable } from ".";

// Tabelle für benutzerspezifische Daten
export const userSpecificData = pgBaseTable(
  "user_specific_data",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 50 }).notNull(),
    version: integer("version").notNull().default(0),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userKeyIndex: unique().on(table.userId, table.key),
    keyIndex: index("user_data_type_idx").on(table.key),
  })
);

export type UserSpecificDataSelect = typeof userSpecificData.$inferSelect;
export type UserSpecificDataInsert = typeof userSpecificData.$inferInsert;

// Tabelle für anwendungsspezifische Daten
export const appSpecificData = pgBaseTable(
  "app_specific_data",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    key: varchar("key", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    version: integer("version").notNull().default(0),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    keyNameIndex: unique().on(table.key, table.name),
    nameIndex: index("app_data_name_idx").on(table.name),
    keyIndex: index("app_data_key_idx").on(table.key),
  })
);

export type AppSpecificDataSelect = typeof appSpecificData.$inferSelect;
export type AppSpecificDataInsert = typeof appSpecificData.$inferInsert;

// Beziehungen definieren
export const userSpecificDataRelations = relations(
  userSpecificData,
  ({ one }) => ({
    user: one(users, {
      fields: [userSpecificData.userId],
      references: [users.id],
    }),
  })
);
