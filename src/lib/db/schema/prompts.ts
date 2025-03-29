import { getTableColumns, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  jsonb,
  pgEnum,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pgBaseTable } from ".";
import { organisations, teams, users } from "./users";
import { workspacePromptTemplates } from "./workspaces";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-valibot";
import { knowledgeEntry, knowledgeGroup, knowledgeFilters } from "./knowledge";

export type LLMOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  outputType?: "text" | "json" | "image" | "audio";
};

// Table to store LLM Prompt templates
export const promptTemplates = pgBaseTable(
  "prompt_templates",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    label: varchar("label", { length: 255 }).notNull().default(""),
    description: varchar("description", { length: 1000 }).notNull().default(""),
    // optional type (short string) to group prompts
    category: varchar("category", { length: 255 }).notNull().default(""),
    systemPrompt: text("system_prompt").notNull(),
    userPrompt: text("user_prompt"),
    langCode: varchar("lang_code", { length: 2 }),
    // optional user id of the creator
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    organisationId: uuid("organisation_id").references(() => organisations.id, {
      onDelete: "cascade",
    }),
    hidden: boolean("hidden").notNull().default(false),
    needsInitialCall: boolean("needs_initial_call").notNull().default(false),
    llmOptions: jsonb("llm_options").$type<LLMOptions>().default({}),
    // metadata
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (promptTemplates) => [
    unique("prompt_templates_name_category_idx").on(
      promptTemplates.name,
      promptTemplates.category
    ),
    index("prompt_templates_name_idx").on(promptTemplates.name),
    index("prompt_templates_type_idx").on(promptTemplates.category),
    index("prompt_templates_user_id_idx").on(promptTemplates.userId),
    index("prompt_templates_lang_code_idx").on(promptTemplates.langCode),
    check("prompt_templates_name_min_length", sql`length(name) > 0`),
    check("prompt_templates_category_min_length", sql`length(category) > 0`),
    check(
      "prompt_templates_system_prompt_min_length",
      sql`length(system_prompt) > 0`
    ),
    check(
      "prompt_templates_system_prompt_max_length",
      sql`length(system_prompt) <= 10000`
    ),
    check(
      "prompt_templates_user_prompt_max_length",
      sql`length(user_prompt) <= 10000`
    ),
  ]
);

export type PromptTemplatesSelect = typeof promptTemplates.$inferSelect;
export type PromptTemplatesInsert = typeof promptTemplates.$inferInsert;

export const promptTemplatesSelectSchema = createSelectSchema(promptTemplates);
export const promptTemplatesInsertSchema = createInsertSchema(promptTemplates);
export const promptTemplatesUpdateSchema = createUpdateSchema(promptTemplates);

export const promptTemplatePlaceholderTypeEnum = pgEnum(
  "prompt_template_type",
  ["text", "image"]
);

export const promptTemplatePlaceholders = pgBaseTable(
  "prompt_template_placeholders",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    promptTemplateId: uuid("prompt_template_id")
      .notNull()
      .references(() => promptTemplates.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    label: varchar("label", { length: 255 }).notNull().default(""),
    description: varchar("description", { length: 1000 }).notNull().default(""),
    type: promptTemplatePlaceholderTypeEnum("type").notNull().default("text"),
    requiredByUser: boolean("required_by_user").notNull().default(false),
    defaultValue: text("default_value"),
    hidden: boolean("hidden").notNull().default(false),
  },
  (promptTemplatePlaceholders) => [
    index("prompt_template_id_idx").on(
      promptTemplatePlaceholders.promptTemplateId
    ),
    check(
      "prompt_template_placeholders_name_min_length",
      sql`length(name) > 0`
    ),
    check(
      "prompt_template_placeholders_label_min_length",
      sql`length(label) > 0`
    ),
    check(
      "prompt_template_placeholders_description_max_length",
      sql`length(description) <= 10000`
    ),
  ]
);

export type PromptTemplatePlaceholdersSelect =
  typeof promptTemplatePlaceholders.$inferSelect;
export type PromptTemplatePlaceholdersInsert =
  typeof promptTemplatePlaceholders.$inferInsert;
export type PromptTemplatePlaceholdersUpdate =
  Partial<PromptTemplatePlaceholdersInsert>;

export const promptTemplatePlaceholdersSelectSchema = createSelectSchema(
  promptTemplatePlaceholders
);
export const promptTemplatePlaceholdersInsertSchema = createInsertSchema(
  promptTemplatePlaceholders
);
export const promptTemplatePlaceholdersUpdateSchema = createUpdateSchema(
  promptTemplatePlaceholders
);

// Table for placeholder examples/suggestions

export const promptTemplatePlaceholderExamples = pgBaseTable(
  "prompt_template_placeholder_examples",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    placeholderId: uuid("placeholder_id")
      .notNull()
      .references(() => promptTemplatePlaceholders.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
  },
  (table) => [
    index("placeholder_examples_placeholder_id_idx").on(table.placeholderId),
    check(
      "prompt_template_placeholder_examples_value_min_length",
      sql`length(value) > 0`
    ),
    check(
      "prompt_template_placeholder_examples_value_max_length",
      sql`length(value) <= 10000`
    ),
  ]
);

export type PromptTemplatePlaceholderExamplesSelect =
  typeof promptTemplatePlaceholderExamples.$inferSelect;
export type PromptTemplatePlaceholderExamplesInsert =
  typeof promptTemplatePlaceholderExamples.$inferInsert;

export const promptTemplatePlaceholderExamplesSelectSchema = createSelectSchema(
  promptTemplatePlaceholderExamples
);
export const promptTemplatePlaceholderExamplesInsertSchema = createInsertSchema(
  promptTemplatePlaceholderExamples
);
export const promptTemplatePlaceholderExamplesUpdateSchema = createUpdateSchema(
  promptTemplatePlaceholderExamples
);

// Update the relations

export const promptTemplatePlaceholdersRelations = relations(
  promptTemplatePlaceholders,
  ({ one, many }) => ({
    promptTemplate: one(promptTemplates, {
      fields: [promptTemplatePlaceholders.promptTemplateId],
      references: [promptTemplates.id],
    }),
    suggestions: many(promptTemplatePlaceholderExamples),
  })
);

// Add relation for suggestions table
export const promptTemplatePlaceholderExamplesRelations = relations(
  promptTemplatePlaceholderExamples,
  ({ one }) => ({
    placeholder: one(promptTemplatePlaceholders, {
      fields: [promptTemplatePlaceholderExamples.placeholderId],
      references: [promptTemplatePlaceholders.id],
    }),
  })
);

// Table for linking prompt templates to specific knowledge entries
export const promptTemplateKnowledgeEntries = pgBaseTable(
  "prompt_template_knowledge_entries",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    promptTemplateId: uuid("prompt_template_id")
      .notNull()
      .references(() => promptTemplates.id, { onDelete: "cascade" }),
    knowledgeEntryId: uuid("knowledge_entry_id")
      .notNull()
      .references(() => knowledgeEntry.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("prompt_template_knowledge_entry_unique").on(
      table.promptTemplateId,
      table.knowledgeEntryId
    ),
    index("prompt_template_knowledge_entries_prompt_id_idx").on(
      table.promptTemplateId
    ),
    index("prompt_template_knowledge_entries_entry_id_idx").on(
      table.knowledgeEntryId
    ),
  ]
);

// Table for linking prompt templates to knowledge groups
export const promptTemplateKnowledgeGroups = pgBaseTable(
  "prompt_template_knowledge_groups",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    promptTemplateId: uuid("prompt_template_id")
      .notNull()
      .references(() => promptTemplates.id, { onDelete: "cascade" }),
    knowledgeGroupId: uuid("knowledge_group_id")
      .notNull()
      .references(() => knowledgeGroup.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("prompt_template_knowledge_group_unique").on(
      table.promptTemplateId,
      table.knowledgeGroupId
    ),
    index("prompt_template_knowledge_groups_prompt_id_idx").on(
      table.promptTemplateId
    ),
    index("prompt_template_knowledge_groups_group_id_idx").on(
      table.knowledgeGroupId
    ),
  ]
);

// Table for linking prompt templates to knowledge filters
export const promptTemplateKnowledgeFilters = pgBaseTable(
  "prompt_template_knowledge_filters",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    promptTemplateId: uuid("prompt_template_id")
      .notNull()
      .references(() => promptTemplates.id, { onDelete: "cascade" }),
    knowledgeFilterId: uuid("knowledge_filter_id")
      .notNull()
      .references(() => knowledgeFilters.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("prompt_template_knowledge_filter_unique").on(
      table.promptTemplateId,
      table.knowledgeFilterId
    ),
    index("prompt_template_knowledge_filters_prompt_id_idx").on(
      table.promptTemplateId
    ),
    index("prompt_template_knowledge_filters_filter_id_idx").on(
      table.knowledgeFilterId
    ),
  ]
);

// Define types for the new tables
export type PromptTemplateKnowledgeEntriesSelect =
  typeof promptTemplateKnowledgeEntries.$inferSelect;
export type PromptTemplateKnowledgeEntriesInsert =
  typeof promptTemplateKnowledgeEntries.$inferInsert;

export type PromptTemplateKnowledgeGroupsSelect =
  typeof promptTemplateKnowledgeGroups.$inferSelect;
export type PromptTemplateKnowledgeGroupsInsert =
  typeof promptTemplateKnowledgeGroups.$inferInsert;

export type PromptTemplateKnowledgeFiltersSelect =
  typeof promptTemplateKnowledgeFilters.$inferSelect;
export type PromptTemplateKnowledgeFiltersInsert =
  typeof promptTemplateKnowledgeFilters.$inferInsert;

// Create schemas for the new tables
export const promptTemplateKnowledgeEntriesSelectSchema = createSelectSchema(
  promptTemplateKnowledgeEntries
);
export const promptTemplateKnowledgeEntriesInsertSchema = createInsertSchema(
  promptTemplateKnowledgeEntries
);

export const promptTemplateKnowledgeGroupsSelectSchema = createSelectSchema(
  promptTemplateKnowledgeGroups
);
export const promptTemplateKnowledgeGroupsInsertSchema = createInsertSchema(
  promptTemplateKnowledgeGroups
);

export const promptTemplateKnowledgeFiltersSelectSchema = createSelectSchema(
  promptTemplateKnowledgeFilters
);
export const promptTemplateKnowledgeFiltersInsertSchema = createInsertSchema(
  promptTemplateKnowledgeFilters
);

// Modify the existing promptTemplatesRelations
export const promptTemplatesRelations = relations(
  promptTemplates,
  ({ many }) => ({
    placeholders: many(promptTemplatePlaceholders),
    promptTemplatePlaceholders: many(promptTemplatePlaceholders),
    workspaces: many(workspacePromptTemplates),
    knowledgeEntries: many(promptTemplateKnowledgeEntries),
    knowledgeGroups: many(promptTemplateKnowledgeGroups),
    knowledgeFilters: many(promptTemplateKnowledgeFilters),
  })
);

// Add relations for the new tables
export const promptTemplateKnowledgeEntriesRelations = relations(
  promptTemplateKnowledgeEntries,
  ({ one }) => ({
    promptTemplate: one(promptTemplates, {
      fields: [promptTemplateKnowledgeEntries.promptTemplateId],
      references: [promptTemplates.id],
    }),
    knowledgeEntry: one(knowledgeEntry, {
      fields: [promptTemplateKnowledgeEntries.knowledgeEntryId],
      references: [knowledgeEntry.id],
    }),
  })
);

export const promptTemplateKnowledgeGroupsRelations = relations(
  promptTemplateKnowledgeGroups,
  ({ one }) => ({
    promptTemplate: one(promptTemplates, {
      fields: [promptTemplateKnowledgeGroups.promptTemplateId],
      references: [promptTemplates.id],
    }),
    knowledgeGroup: one(knowledgeGroup, {
      fields: [promptTemplateKnowledgeGroups.knowledgeGroupId],
      references: [knowledgeGroup.id],
    }),
  })
);

export const promptTemplateKnowledgeFiltersRelations = relations(
  promptTemplateKnowledgeFilters,
  ({ one }) => ({
    promptTemplate: one(promptTemplates, {
      fields: [promptTemplateKnowledgeFilters.promptTemplateId],
      references: [promptTemplates.id],
    }),
    knowledgeFilter: one(knowledgeFilters, {
      fields: [promptTemplateKnowledgeFilters.knowledgeFilterId],
      references: [knowledgeFilters.id],
    }),
  })
);

// Table to store reusable prompt snippets for prompt building
export const promptSnippets = pgBaseTable(
  "prompt_snippets",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    content: text("content").notNull(),
    category: varchar("category", { length: 255 }).notNull().default(""),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    organisationId: uuid("organisation_id")
      .references(() => organisations.id, {
        onDelete: "cascade",
      })
      .notNull(),
    organisationWide: boolean("organisation_wide").notNull().default(false),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (promptSnippets) => [
    unique("prompt_snippets_name_category_idx").on(
      promptSnippets.name,
      promptSnippets.category
    ),
    index("prompt_snippets_name_idx").on(promptSnippets.name),
    index("prompt_snippets_category_idx").on(promptSnippets.category),
    index("prompt_snippets_user_id_idx").on(promptSnippets.userId),
    check("prompt_snippets_name_min_length", sql`length(name) > 0`),
    check("prompt_snippets_content_min_length", sql`length(content) > 0`),
    check("prompt_snippets_content_max_length", sql`length(content) <= 10000`),
  ]
);

export type PromptSnippetsSelect = typeof promptSnippets.$inferSelect;
export type PromptSnippetsInsert = typeof promptSnippets.$inferInsert;

export const promptSnippetsSelectSchema = createSelectSchema(promptSnippets);
export const promptSnippetsInsertSchema = createInsertSchema(promptSnippets);
export const promptSnippetsUpdateSchema = createUpdateSchema(promptSnippets);

export const promptSnippetsRelations = relations(promptSnippets, ({ one }) => ({
  user: one(users, {
    fields: [promptSnippets.userId],
    references: [users.id],
  }),
}));
