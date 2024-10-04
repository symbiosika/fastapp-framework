/**
 * Schema definition for secrets that needs to be stored in the database
 */

import { sql } from "drizzle-orm";
import {
  uuid,
  timestamp,
  text,
  pgSchema,
  unique,
  index,
} from "drizzle-orm/pg-core";

const dataSchema = pgSchema("data");

// Secrets
export const secrets = dataSchema.table(
  "secrets",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    reference: text("reference").notNull(),
    referenceId: uuid("reference_id").notNull(),
    name: text("name").notNull(),
    label: text("label").notNull(),
    value: text("value").notNull(),
    type: text("type").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (secrets) => ({
    unq: unique().on(secrets.reference, secrets.name),
    idx: index("idx").on(secrets.referenceId),
    refIdx: index("ref_idx").on(secrets.reference),
    refIdIdx: index("ref_id_idx").on(secrets.referenceId),
    nameIdx: index("name_idx").on(secrets.name),
  })
);
