/**
 * Schema definition for secrets that needs to be stored in the database
 */

import { sql } from "drizzle-orm";
import {
  uuid,
  timestamp,
  text,
  unique,
  index,
  varchar,
} from "drizzle-orm/pg-core";
import { pgBaseTable } from ".";

// Secrets
export const secrets = pgBaseTable(
  "secrets",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    reference: varchar("reference", { length: 255 }).notNull(),
    referenceId: uuid("reference_id"),
    name: varchar("name", { length: 255 }).notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    value: text("value").notNull(),
    type: varchar("type", { length: 255 }).notNull(), // encryption type like aes-256-cbc
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (secrets) => ({
    unq: unique().on(secrets.reference, secrets.name),
    idx: index("secrets_idx").on(secrets.referenceId),
    refIdx: index("secrets_ref_idx").on(secrets.reference),
    refIdIdx: index("secrets_ref_id_idx").on(secrets.referenceId),
    nameIdx: index("secrets_name_idx").on(secrets.name),
    typeIdx: index("secrets_type_idx").on(secrets.type),
  })
);

export type SecretsSelect = typeof secrets.$inferSelect;
export type SecretsInsert = typeof secrets.$inferInsert;
