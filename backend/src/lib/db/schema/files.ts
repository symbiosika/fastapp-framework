import {
  varchar,
  uuid,
  timestamp,
  pgSchema,
  customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const dataSchema = pgSchema("data");

const bytea = customType<{
  data: Buffer;
  default: false;
}>({
  dataType() {
    return "bytea";
  },
});

// Table files
export const files = dataSchema.table("files", {
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
