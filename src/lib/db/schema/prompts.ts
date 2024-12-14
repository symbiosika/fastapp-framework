import { getTableColumns, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pgBaseTable } from ".";
import { users } from "./users";

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
    template: text("template").notNull(),
    langCode: varchar("lang_code", { length: 2 }),
    // optional user id of the creator
    userId: uuid("user_id").references(() => users.id),
    hidden: boolean("hidden").notNull().default(false),
    needsInitialCall: boolean("needs_initial_call").notNull().default(false),
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

export const promptTemplatePlaceholdersRelations = relations(
  promptTemplatePlaceholders,
  ({ one }) => ({
    promptTemplate: one(promptTemplates, {
      fields: [promptTemplatePlaceholders.promptTemplateId],
      references: [promptTemplates.id],
    }),
  })
);

export const promptTemplatesRelations = relations(
  promptTemplates,
  ({ many }) => ({
    promptTemplatePlaceholders: many(promptTemplatePlaceholders),
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

export const promptSnippetsRelations = relations(promptSnippets, ({ one }) => ({
  user: one(users, {
    fields: [promptSnippets.userId],
    references: [users.id],
  }),
}));
