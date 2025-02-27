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
  check,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pgBaseTable } from ".";
import { plugins } from "./plugins";
import { organisations, teams, users } from "./users";
import {
  workspaceKnowledgeEntries,
  workspaceKnowledgeTexts,
  workspaces,
} from "./workspaces";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-valibot";

// Enum for the type of file source
export const fileSourceTypeEnum = pgEnum("file_source_type", [
  "db",
  "local",
  "url",
  "text",
  "finetuning",
  "plugin",
  "external",
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
      .references(() => organisations.id, { onDelete: "cascade" }),
    // optional team id to organize knowledge entries into teams.
    // security feature to limit access to knowledge entries
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    // optional user id to assign knowledge entries to a user.
    // security feature to limit access to knowledge entries
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    // optional workspace id to assign knowledge entries to a workspace.
    // security feature to limit access to knowledge entries
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    text: text("text").notNull(),
    title: varchar("title", { length: 1000 }).notNull().default(""),
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
    index("knowledge_text_team_id_idx").on(knowledgeText.teamId),
    index("knowledge_text_user_id_idx").on(knowledgeText.userId),
    index("knowledge_text_workspace_id_idx").on(knowledgeText.workspaceId),
    check("knowledge_text_text_min_length", sql`length(text) > 3`),
  ]
);

export type KnowledgeTextSelect = typeof knowledgeText.$inferSelect;
export type KnowledgeTextInsert = typeof knowledgeText.$inferInsert;

export const knowledgeTextSchema = createSelectSchema(knowledgeText);
export const knowledgeTextInsertSchema = createInsertSchema(knowledgeText);
export const knowledgeTextUpdateSchema = createUpdateSchema(knowledgeText);

export type KnowledgeTextMeta = {
  sourceUri?: string;
  textLength?: number;
};

// Main table for all knowledge entries
export const knowledgeEntry = pgBaseTable(
  "knowledge_entry",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    // optional team id to organize knowledge entries into teams.
    // security feature to limit access to knowledge entries
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    // optional user id to assign knowledge entries to a user.
    // security feature to limit access to knowledge entries
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    // optional workspace id to assign knowledge entries to a workspace.
    // security feature to limit access to knowledge entries
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    sourceType: fileSourceTypeEnum("source_type").notNull(),
    sourceId: uuid("source_id"),
    sourceExternalId: varchar("source_external_id", { length: 255 }),
    sourceFileBucket: varchar("source_file_bucket", { length: 255 }),
    sourceUrl: varchar("source_url", { length: 1000 }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    abstract: text("abstract"),
    meta: jsonb("meta").$type<KnowledgeTextMeta>().default({}),
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
    index("knowledge_entry_team_id_idx").on(knowledgeEntry.teamId),
    index("knowledge_entry_user_id_idx").on(knowledgeEntry.userId),
    index("knowledge_entry_workspace_id_idx").on(knowledgeEntry.workspaceId),
    index("knowledge_entry_source_external_id_idx").on(
      knowledgeEntry.sourceExternalId
    ),
    check(
      "knowledge_entry_description_max_length",
      sql`length(description) <= 10000`
    ),
  ]
);

export type KnowledgeEntrySelect = typeof knowledgeEntry.$inferSelect;
export type KnowledgeEntryInsert = typeof knowledgeEntry.$inferInsert;

export const knowledgeEntrySchema = createSelectSchema(knowledgeEntry);
export const knowledgeEntryInsertSchema = createInsertSchema(knowledgeEntry);
export const knowledgeEntryUpdateSchema = createUpdateSchema(knowledgeEntry);

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
    header: varchar("header", { length: 1000 }),
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

export const knowledgeChunksSchema = createSelectSchema(knowledgeChunks);
export const knowledgeChunksInsertSchema = createInsertSchema(knowledgeChunks);
export const knowledgeChunksUpdateSchema = createUpdateSchema(knowledgeChunks);

// Table for fine tuning data
export const fineTuningData = pgBaseTable(
  "knowledge_fine_tuning_data",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    // optional team id to organize knowledge entries into teams.
    // security feature to limit access to knowledge entries
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    // optional user id to assign knowledge entries to a user.
    // security feature to limit access to knowledge entries
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    // optional workspace id to assign knowledge entries to a workspace.
    // security feature to limit access to knowledge entries
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    knowledgeEntryId: uuid("knowledge_entry_id")
      .notNull()
      .references(() => knowledgeEntry.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }),
    category: varchar("category", { length: 255 }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
  },
  (table) => [
    index("knowledge_fine_tuning_entry_id_idx").on(table.knowledgeEntryId),
    index("knowledge_fine_tuning_entry_name_idx").on(table.name),
    index("knowledge_fine_tuning_entry_category_idx").on(table.category),
    index("knowledge_fine_tuning_entry_organisation_id_idx").on(
      table.organisationId
    ),
    index("knowledge_fine_tuning_entry_team_id_idx").on(table.teamId),
    index("knowledge_fine_tuning_entry_user_id_idx").on(table.userId),
    index("knowledge_fine_tuning_entry_workspace_id_idx").on(table.workspaceId),
    check(
      "knowledge_fine_tuning_answer_max_length",
      sql`length(answer) <= 10000`
    ),
    check(
      "knowledge_fine_tuning_question_max_length",
      sql`length(question) <= 10000`
    ),
  ]
);

export type FineTuningDataSelect = typeof fineTuningData.$inferSelect;
export type FineTuningDataInsert = typeof fineTuningData.$inferInsert;

export const fineTuningDataSchema = createSelectSchema(fineTuningData);
export const fineTuningDataInsertSchema = createInsertSchema(fineTuningData);
export const fineTuningDataUpdateSchema = createUpdateSchema(fineTuningData);

// Table for knowledge filters definition
// This table is used to define the filters for knowledge entries

export const knowledgeFilters = pgBaseTable(
  "knowledge_filters",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
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

export type KnowledgeFiltersSelect = typeof knowledgeFilters.$inferSelect;
export type KnowledgeFiltersInsert = typeof knowledgeFilters.$inferInsert;

export const knowledgeFiltersSchema = createSelectSchema(knowledgeFilters);
export const knowledgeFiltersInsertSchema =
  createInsertSchema(knowledgeFilters);
export const knowledgeFiltersUpdateSchema =
  createUpdateSchema(knowledgeFilters);

// Knowledge entry filters
// This table is used to assign knowledge filters to knowledge entries

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

export type KnowledgeEntryFiltersSelect =
  typeof knowledgeEntryFilters.$inferSelect;
export type KnowledgeEntryFiltersInsert =
  typeof knowledgeEntryFilters.$inferInsert;

export const knowledgeEntryFiltersSchema = createSelectSchema(
  knowledgeEntryFilters
);
export const knowledgeEntryFiltersInsertSchema = createInsertSchema(
  knowledgeEntryFilters
);
export const knowledgeEntryFiltersUpdateSchema = createUpdateSchema(
  knowledgeEntryFilters
);

// Table for external source syncs
// This table is used to sync knowledge entries from external sources
// and to keep track of the last synced and changed data
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
    lastHash: varchar("last_hash", { length: 1000 }),
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

export type KnowledgeSourceSelect = typeof knowledgeSource.$inferSelect;
export type KnowledgeSourceInsert = typeof knowledgeSource.$inferInsert;

export const knowledgeSourceSchema = createSelectSchema(knowledgeSource);
export const knowledgeSourceInsertSchema = createInsertSchema(knowledgeSource);
export const knowledgeSourceUpdateSchema = createUpdateSchema(knowledgeSource);

// Relations
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
  ({ many, one }) => ({
    knowledgeChunks: many(knowledgeChunks),
    filters: many(knowledgeEntryFilters),
    workspaces: many(workspaceKnowledgeEntries),
    organisation: one(organisations, {
      fields: [knowledgeEntry.organisationId],
      references: [organisations.id],
    }),
    team: one(teams, {
      fields: [knowledgeEntry.teamId],
      references: [teams.id],
    }),
    user: one(users, {
      fields: [knowledgeEntry.userId],
      references: [users.id],
    }),
    workspace: one(workspaces, {
      fields: [knowledgeEntry.workspaceId],
      references: [workspaces.id],
    }),
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

export const fineTuningDataRelations = relations(fineTuningData, ({ one }) => ({
  knowledgeEntry: one(knowledgeEntry, {
    fields: [fineTuningData.knowledgeEntryId],
    references: [knowledgeEntry.id],
  }),
  organisation: one(organisations, {
    fields: [fineTuningData.organisationId],
    references: [organisations.id],
  }),
  team: one(teams, {
    fields: [fineTuningData.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [fineTuningData.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [fineTuningData.workspaceId],
    references: [workspaces.id],
  }),
}));

export const knowledgeTextRelations = relations(
  knowledgeText,
  ({ many, one }) => ({
    workspaces: many(workspaceKnowledgeTexts),
    organisation: one(organisations, {
      fields: [knowledgeText.organisationId],
      references: [organisations.id],
    }),
    team: one(teams, {
      fields: [knowledgeText.teamId],
      references: [teams.id],
    }),
    user: one(users, {
      fields: [knowledgeText.userId],
      references: [users.id],
    }),
    workspace: one(workspaces, {
      fields: [knowledgeText.workspaceId],
      references: [workspaces.id],
    }),
  })
);
