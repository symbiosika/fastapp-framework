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
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pgBaseTable } from ".";

// Enum for the type of file source
export const fileSourceTypeEnum = pgEnum("file_source_type", [
  "db",
  "local",
  "url",
  "text",
  "finetuning",
]);

// Table to store input texts
export const knowledgeText = pgBaseTable(
  "knowledge_text",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    text: text("text").notNull(),
    title: text("title").notNull().default(""),
    source: varchar("source", { length: 1000 }).notNull().default(""),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (knowledgeText) => ({
    createdAtIdx: index("knowledge_text_created_at_idx").on(
      knowledgeText.createdAt
    ),
    titleIdx: index("knowledge_text_title_idx").on(knowledgeText.title),
    sourceIdx: index("knowledge_text_source_idx").on(knowledgeText.source),
  })
);

export type KnowledgeTextSelect = typeof knowledgeText.$inferSelect;
export type KnowledgeTextInsert = typeof knowledgeText.$inferInsert;

// Main table for all knowledge entries
export const knowledgeEntry = pgBaseTable(
  "knowledge_entry",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    fileSourceType: fileSourceTypeEnum("file_source_type").notNull(),
    fileSourceId: uuid("file_source_id"),
    fileSourceBucket: text("file_source_bucket"),
    fileSourceUrl: text("file_source_url"),
    name: varchar("name", { length: 255 }).notNull(),
    category1: varchar("category1", { length: 255 }),
    category2: varchar("category2", { length: 255 }),
    category3: varchar("category3", { length: 255 }),
    description: text("description"),
    abstract: text("abstract"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (knowledgeEntry) => ({
    nameIdx: uniqueIndex("knowledgeentry_name_idx").on(knowledgeEntry.name),
    fileSourceTypeIdx: index("knowledge_entry_file_source_type_idx").on(
      knowledgeEntry.fileSourceType
    ),
    category1Idx: index("knowledgeentry_category1_idx").on(
      knowledgeEntry.category1
    ),
    category2Idx: index("knowledgeentry_category2_idx").on(
      knowledgeEntry.category2
    ),
    category3Idx: index("knowledgeentry_category3_idx").on(
      knowledgeEntry.category3
    ),
    createdAtIdx: index("knowledgeentry_created_at_idx").on(
      knowledgeEntry.createdAt
    ),
    updatedAtIdx: index("knowledgeentry_updated_at_idx").on(
      knowledgeEntry.updatedAt
    ),
  })
);

export type KnowledgeEntrySelect = typeof knowledgeEntry.$inferSelect;
export type KnowledgeEntryInsert = typeof knowledgeEntry.$inferInsert;

// Table to save the raw text chunks for each knowledge entry
export const knowledgeChunks = pgBaseTable(
  "knowledge_chunks",
  {
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
  },
  (knowledgeChunks) => ({
    knowledgeEntryIdIdx: index("knowledge_chunks_knowledge_entry_id_idx").on(
      knowledgeChunks.knowledgeEntryId
    ),
    createdAtIdx: index("knowledge_chunks_created_at_idx").on(
      knowledgeChunks.createdAt
    ),
    headerIdx: index("knowledge_chunks_header_idx").on(knowledgeChunks.header),
  })
);

export type KnowledgeChunksSelect = typeof knowledgeChunks.$inferSelect;
export type KnowledgeChunksInsert = typeof knowledgeChunks.$inferInsert;

// Table for fine tuning data
export const fineTuningData = pgBaseTable(
  "knowledge_fine_tuning_data",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    knowledgeEntryId: uuid("knowledge_entry_id")
      .notNull()
      .references(() => knowledgeEntry.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }),
    category: varchar("category", { length: 255 }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
  },
  (table) => ({
    knowledgeEntryIdIdx: index("knowledge_entry_id_idx").on(
      table.knowledgeEntryId
    ),
    nameIdx: index("knowledge_entry_name_idx").on(table.name),
    categoryIdx: index("knowledge_entry_category_idx").on(table.category),
  })
);

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

export const fineTuningDataRelations = relations(fineTuningData, ({ one }) => ({
  knowledgeEntry: one(knowledgeEntry, {
    fields: [fineTuningData.knowledgeEntryId],
    references: [knowledgeEntry.id],
  }),
}));
