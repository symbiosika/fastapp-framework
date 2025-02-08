import {
  varchar,
  uuid,
  timestamp,
  customType,
  index,
  text,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { pgBaseTable } from ".";
import { organisations } from "./users";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-valibot";
import { workspaces } from "./workspaces";
import { chatSessions } from "./chat";

const bytea = customType<{
  data: Buffer;
  default: false;
}>({
  dataType() {
    return "bytea";
  },
});

// Table files
export const files = pgBaseTable(
  "files",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    organisationId: uuid("organisation_id")
      .references(() => organisations.id, {
        onDelete: "cascade",
      })
      .notNull(),
    bucket: varchar("bucket", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 255 }).notNull(),
    extension: varchar("extension", { length: 255 }).notNull(),
    file: bytea("file").notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }),
    // reference on chat and workspace to drop files automatically
    chatId: text("chat_id").references(() => chatSessions.id, {
      onDelete: "cascade",
    }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    index("files_id_idx").on(table.id),
    index("files_bucket_name_idx").on(table.bucket),
    index("files_created_at_idx").on(table.createdAt),
    index("files_updated_at_idx").on(table.updatedAt),
    index("files_name_idx").on(table.name),
    index("files_expires_at_idx").on(table.expiresAt),
    index("files_chat_id_idx").on(table.chatId),
    index("files_workspace_id_idx").on(table.workspaceId),
  ]
);

export type FilesSelect = typeof files.$inferSelect;
export type FilesInsert = typeof files.$inferInsert;

export const filesSelectSchema = createSelectSchema(files);
export const filesInsertSchema = createInsertSchema(files);
export const filesUpdateSchema = createUpdateSchema(files);
