import { varchar, uuid, timestamp, customType } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { pgBaseTable } from ".";

const bytea = customType<{
  data: Buffer;
  default: false;
}>({
  dataType() {
    return "bytea";
  },
});

// Table files
export const files = pgBaseTable("files", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  bucket: varchar("bucket", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 255 }).notNull(),
  extension: varchar("extension", { length: 255 }).notNull(),
  file: bytea("file").notNull(),
});

export type FilesSelect = typeof files.$inferSelect;
export type FilesInsert = typeof files.$inferInsert;
