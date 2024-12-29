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
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pgBaseTable } from ".";
import { plugins } from "./plugins";
import { organisations } from "./users";

// Enum for the type of file source
export const fileSourceTypeEnum = pgEnum("file_source_type", [
  "db",
  "local",
  "url",
  "text",
  "finetuning",
  "plugin",
]);

// Table to store input texts
export const knowledgeText = pgBaseTable(
  "knowledge_text",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    text: text("text").notNull(),
    title: text("title").notNull().default(""),
    meta: jsonb("meta").notNull().default("{}"),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (knowledgeText) => [
    index("knowledge_text_created_at_idx").on(knowledgeText.createdAt),
    index("knowledge_text_title_idx").on(knowledgeText.title),
    index("knowledge_text_organisation_id_idx").on(
      knowledgeText.organisationId
    ),
  ]
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
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    sourceType: fileSourceTypeEnum("source_type").notNull(),
    sourceId: uuid("source_id"),
    sourceFileBucket: text("source_file_bucket"),
    sourceUrl: text("source_url"),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    abstract: text("abstract"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (knowledgeEntry) => [
    uniqueIndex("knowledgeentry_name_idx").on(knowledgeEntry.name),
    index("knowledge_entry_file_source_type_idx").on(knowledgeEntry.sourceType),
    index("knowledgeentry_created_at_idx").on(knowledgeEntry.createdAt),
    index("knowledgeentry_updated_at_idx").on(knowledgeEntry.updatedAt),
    index("knowledgeentry_organisation_id_idx").on(
      knowledgeEntry.organisationId
    ),
  ]
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
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    embeddingModel: varchar("embedding_model", { length: 255 })
      .notNull()
      .default("")
      .notNull(),
    textEmbedding: vector("text_embedding", { dimensions: 1536 }).notNull(),
  },
  (knowledgeChunks) => [
    index("knowledge_chunks_knowledge_entry_id_idx").on(
      knowledgeChunks.knowledgeEntryId
    ),
    index("knowledge_chunks_created_at_idx").on(knowledgeChunks.createdAt),
    index("knowledge_chunks_header_idx").on(knowledgeChunks.header),
  ]
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
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    knowledgeEntryId: uuid("knowledge_entry_id")
      .notNull()
      .references(() => knowledgeEntry.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }),
    category: varchar("category", { length: 255 }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
  },
  (table) => [
    index("knowledge_entry_id_idx").on(table.knowledgeEntryId),
    index("knowledge_entry_name_idx").on(table.name),
    index("knowledge_entry_category_idx").on(table.category),
    index("knowledge_entry_organisation_id_idx").on(table.organisationId),
  ]
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

export const fineTuningDataRelations = relations(fineTuningData, ({ one }) => ({
  knowledgeEntry: one(knowledgeEntry, {
    fields: [fineTuningData.knowledgeEntryId],
    references: [knowledgeEntry.id],
  }),
}));

// Table for knowledge filters definition
export const knowledgeFilters = pgBaseTable(
  "knowledge_filters",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    category: varchar("category", { length: 50 }).notNull(), // z.B. 'department', 'topic', 'level'
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("knowledge_filters_name_type_unique").on(
      table.name,
      table.category
    ),
    index("knowledge_filters_category_name_idx").on(table.category, table.name),
  ]
);

// Table for knowledge entry filters
export const knowledgeEntryFilters = pgBaseTable(
  "knowledge_entry_filters",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    knowledgeEntryId: uuid("knowledge_entry_id")
      .notNull()
      .references(() => knowledgeEntry.id, { onDelete: "cascade" }),
    knowledgeFilterId: uuid("knowledge_filter_id")
      .notNull()
      .references(() => knowledgeFilters.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("knowledge_entry_filter_unique").on(
      table.knowledgeEntryId,
      table.knowledgeFilterId
    ),
    index("knowledge_entry_filters_entry_id_idx").on(table.knowledgeEntryId),
    index("knowledge_entry_filters_filter_id_idx").on(table.knowledgeFilterId),
  ]
);

// Neue Typen exportieren
export type KnowledgeFiltersSelect = typeof knowledgeFilters.$inferSelect;
export type KnowledgeFiltersInsert = typeof knowledgeFilters.$inferInsert;
export type KnowledgeEntryFiltersSelect =
  typeof knowledgeEntryFilters.$inferSelect;
export type KnowledgeEntryFiltersInsert =
  typeof knowledgeEntryFilters.$inferInsert;

// Neue Relationen definieren
export const knowledgeEntryFiltersRelations = relations(
  knowledgeEntryFilters,
  ({ one }) => ({
    knowledgeEntry: one(knowledgeEntry, {
      fields: [knowledgeEntryFilters.knowledgeEntryId],
      references: [knowledgeEntry.id],
    }),
    filter: one(knowledgeFilters, {
      fields: [knowledgeEntryFilters.knowledgeFilterId],
      references: [knowledgeFilters.id],
    }),
  })
);

export const knowledgeEntryRelations = relations(
  knowledgeEntry,
  ({ many }) => ({
    knowledgeChunks: many(knowledgeChunks),
    filters: many(knowledgeEntryFilters),
  })
);

// Table for external source syncys
export const knowledgeSource = pgBaseTable(
  "knowledge_source",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    pluginId: uuid("plugin_id")
      .notNull()
      .references(() => plugins.id),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    lastSynced: timestamp("last_synced", { mode: "string" }),
    lastHash: text("last_hash"),
    lastChange: timestamp("last_change", {
      mode: "string",
      withTimezone: true,
    }),
    knowledgeEntryId: uuid("knowledge_entry_id")
      .notNull()
      .references(() => knowledgeEntry.id, { onDelete: "cascade" }),
    meta: jsonb("meta").default("{}"),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("knowledge_source_plugin_external_id_idx").on(
      table.pluginId,
      table.externalId
    ),
    index("knowledge_source_entry_id_idx").on(table.knowledgeEntryId),
  ]
);

export const knowledgeSourceRelations = relations(
  knowledgeSource,
  ({ one }) => ({
    knowledgeEntry: one(knowledgeEntry, {
      fields: [knowledgeSource.knowledgeEntryId],
      references: [knowledgeEntry.id],
    }),
    plugin: one(plugins, {
      fields: [knowledgeSource.pluginId],
      references: [plugins.id],
    }),
  })
);
