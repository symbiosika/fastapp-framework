import {
  varchar,
  uuid,
  timestamp,
  customType,
  pgTableCreator,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const pgTable = pgTableCreator((name) => `fastapp_${name}`);

const bytea = customType<{
  data: Buffer;
  default: false;
}>({
  dataType() {
    return "bytea";
  },
});

// Table files
export const files = pgTable("files", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  name: varchar("name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 255 }).notNull(),
  extension: varchar("extension", { length: 255 }).notNull(),
  file: bytea("file").notNull(),
});
