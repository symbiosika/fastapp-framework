import { getTableColumns, sql } from "drizzle-orm";
import {
  boolean,
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
import { organisations, users } from "./users";
import { workspacePromptTemplates } from "./workspaces";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-valibot";

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
    name: text("name").notNull(),
    label: text("label").notNull().default(""),
    description: text("description").notNull().default(""),
    // optional type (short string) to group prompts
    category: varchar("category", { length: 255 }).notNull().default(""),
    systemPrompt: text("system_prompt").notNull(),
    userPrompt: text("user_prompt"),
    langCode: varchar("lang_code", { length: 2 }),
    // optional user id of the creator
    userId: uuid("user_id").references(() => users.id),

    organisationId: uuid("organisation_id")
      .references(() => organisations.id, {
        onDelete: "cascade",
      })
      .notNull(),
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
    name: text("name").notNull(),
    label: text("label").notNull().default(""),
    description: text("description").notNull().default(""),
    type: promptTemplatePlaceholderTypeEnum("type").notNull().default("text"),
    requiredByUser: boolean("required_by_user").notNull().default(false),
    defaultValue: text("default_value"),
    hidden: boolean("hidden").notNull().default(false),
  },
  (promptTemplatePlaceholders) => [
    index("prompt_template_id_idx").on(
      promptTemplatePlaceholders.promptTemplateId
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
    examples: many(promptTemplatePlaceholderExamples),
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

export const promptTemplatesRelations = relations(
  promptTemplates,
  ({ many }) => ({
    promptTemplatePlaceholders: many(promptTemplatePlaceholders),
    workspaces: many(workspacePromptTemplates),
  })
);

// Table to store reusable prompt snippets for prompt building
export const promptSnippets = pgBaseTable(
  "prompt_snippets",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    content: text("content").notNull(),
    category: varchar("category", { length: 255 }).notNull().default(""),
    userId: uuid("user_id").references(() => users.id),
    organisationId: uuid("organisation_id")
      .references(() => organisations.id, {
        onDelete: "cascade",
      })
      .notNull(),
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
