import { sql } from "drizzle-orm";
import {
  pgEnum,
  text,
  timestamp,
  uuid,
  integer,
  varchar,
  jsonb,
  vector,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pgBaseTable } from ".";

// Enum for the type of file source
export const fileSourceTypeEnum = pgEnum("file_source_type", [
  "db",
  "local",
  "url",
  "text",
]);

// Table to store input texts
export const knowledgeTexts = pgBaseTable("knowledge_texts", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// Main table for all knowledge entries
export const knowledgeEntry = pgBaseTable("knowledge_entry", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  fileSourceType: fileSourceTypeEnum("file_source_type").notNull(),
  fileSourceId: uuid("file_source_id"),
  fileSourceBucket: text("file_source_bucket"),
  fileSourceUrl: text("file_source_url"),
  title: varchar("title", { length: 1000 }).notNull(),
  text: text("text"),
  abstract: text("abstract"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type KnowledgeEntrySelect = typeof knowledgeEntry.$inferSelect;
export type KnowledgeEntryInsert = typeof knowledgeEntry.$inferInsert;

// Table to save the raw text chunks for each knowledge entry
export const knowledgeChunks = pgBaseTable("knowledge_chunks", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  knowledgeEntryId: uuid("knowledge_entry_id")
    .notNull()
    .references(() => knowledgeEntry.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  header: text("header"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  embeddingModel: varchar("embedding_model", { length: 255 })
    .notNull()
    .default("")
    .notNull(),
  textEmbedding: vector("text_embedding", { dimensions: 1536 }).notNull(),
});

export type KnowledgeChunksSelect = typeof knowledgeChunks.$inferSelect;
export type KnowledgeChunksInsert = typeof knowledgeChunks.$inferInsert;

export const knowledgeChunksRelations = relations(
  knowledgeChunks,
  ({ one }) => ({
    knowledgeEntry: one(knowledgeEntry, {
      fields: [knowledgeChunks.knowledgeEntryId],
      references: [knowledgeEntry.id],
    }),
  })
);

export const knowledgeEntryRelations = relations(
  knowledgeEntry,
  ({ many }) => ({
    knowledgeChunks: many(knowledgeChunks),
  })
);
