import { sql } from "drizzle-orm";
import { uuid, timestamp, text, varchar, boolean } from "drizzle-orm/pg-core";
import { organisations, users } from "./users";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-valibot";
import { pgBaseTable } from ".";

// table "avatars"
export const avatars = pgBaseTable("avatars", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  organisationId: uuid("organisation_id")
    .references(() => organisations.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  organisationWide: boolean("organisation_wide").notNull().default(false),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export type AvatarSelect = typeof avatars.$inferSelect;
export type AvatarInsert = typeof avatars.$inferInsert;

export const avatarSelectSchema = createSelectSchema(avatars);
export const avatarInsertSchema = createInsertSchema(avatars);
export const avatarUpdateSchema = createUpdateSchema(avatars);
