import { sql } from "drizzle-orm";
import {
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
    description: text("description").notNull().default(""),
    // optional type (short string) to group prompts
    type: varchar("type", { length: 255 }),
    template: text("template").notNull(),
    langCode: varchar("lang_code", { length: 2 }),
    // optional user id of the creator
    userId: uuid("user_id").references(() => users.id),
    // metadata
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (promptTemplates) => ({
    unq: unique().on(promptTemplates.name, promptTemplates.type),
    nameIdx: index("prompt_templates_name_idx").on(promptTemplates.name),
    typeIdx: index("prompt_templates_type_idx").on(promptTemplates.type),
    userIdIdx: index("prompt_templates_user_id_idx").on(promptTemplates.userId),
    langCodeIdx: index("prompt_templates_lang_code_idx").on(
      promptTemplates.langCode
    ),
  })
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
    description: text("description").notNull().default(""),
    type: promptTemplatePlaceholderTypeEnum("type").notNull().default("text"),
  },
  (promptTemplatePlaceholders) => ({
    promptTemplateIdIdx: index("prompt_template_id_idx").on(
      promptTemplatePlaceholders.promptTemplateId
    ),
  })
);

export type PromptTemplatePlaceholdersSelect =
  typeof promptTemplatePlaceholders.$inferSelect;
export type PromptTemplatePlaceholdersInsert =
  typeof promptTemplatePlaceholders.$inferInsert;

export const promptTemplatePlaceholderDefaults = pgBaseTable(
  "prompt_template_placeholder_defaults",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    promptTemplateId: uuid("prompt_template_id")
      .notNull()
      .references(() => promptTemplates.id, { onDelete: "cascade" }),
    promptTemplatePlaceholderId: uuid("prompt_template_placeholder_id")
      .notNull()
      .references(() => promptTemplatePlaceholders.id, { onDelete: "cascade" }),
    langCode: varchar("lang_code", { length: 2 }),
    value: text("value").notNull(),
  },
  (promptTemplatePlaceholderDefaults) => ({
    unq: unique().on(
      promptTemplatePlaceholderDefaults.promptTemplateId,
      promptTemplatePlaceholderDefaults.promptTemplatePlaceholderId,
      promptTemplatePlaceholderDefaults.langCode
    ),
    langCodeIdx: index("prompt_template_placeholder_defaults_lang_code_idx").on(
      promptTemplatePlaceholderDefaults.langCode
    ),
    promptTemplateIdIdx: index(
      "prompt_template_placeholder_defaults_prompt_template_id_idx"
    ).on(promptTemplatePlaceholderDefaults.promptTemplateId),
  })
);

export type PromptTemplatePlaceholderDefaultsSelect =
  typeof promptTemplatePlaceholderDefaults.$inferSelect;
export type PromptTemplatePlaceholderDefaultsInsert =
  typeof promptTemplatePlaceholderDefaults.$inferInsert;

export const promptTemplatePlaceholdersRelations = relations(
  promptTemplatePlaceholders,
  ({ one, many }) => ({
    promptTemplate: one(promptTemplates, {
      fields: [promptTemplatePlaceholders.promptTemplateId],
      references: [promptTemplates.id],
    }),
    promptTemplatePlaceholderDefaults: many(promptTemplatePlaceholderDefaults),
  })
);

export const promptTemplatesRelations = relations(
  promptTemplates,
  ({ many }) => ({
    promptTemplatePlaceholders: many(promptTemplatePlaceholders),
    promptTemplatePlaceholderDefaults: many(promptTemplatePlaceholderDefaults),
  })
);

export const promptTemplatePlaceholderDefaultsRelations = relations(
  promptTemplatePlaceholderDefaults,
  ({ one }) => ({
    promptTemplatePlaceholder: one(promptTemplatePlaceholders, {
      fields: [promptTemplatePlaceholderDefaults.promptTemplatePlaceholderId],
      references: [promptTemplatePlaceholders.id],
    }),
    promptTemplate: one(promptTemplates, {
      fields: [promptTemplatePlaceholderDefaults.promptTemplateId],
      references: [promptTemplates.id],
    }),
  })
);
