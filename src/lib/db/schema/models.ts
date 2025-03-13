import { sql } from "drizzle-orm";
import {
  uuid,
  timestamp,
  index,
  unique,
  boolean,
  integer,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pgBaseTable } from ".";
import { organisations } from "./users";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-valibot";

// Enum for the type
export const aiProviderModelTypeEnum = pgEnum("ai_provider_model_type", [
  "text",
  "image",
  "audio",
  "embedding",
]);

// AI Provider Models table
export const aiProviderModels = pgBaseTable(
  "ai_provider_models",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    model: varchar("model", { length: 255 }).notNull(),
    inputType: aiProviderModelTypeEnum("input_type").array().notNull(),
    outputType: aiProviderModelTypeEnum("output_type").array().notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    maxTokens: integer("max_tokens").notNull(),
    maxOutputTokens: integer("max_output_tokens").notNull(),
    endpoint: varchar("endpoint", { length: 255 }).notNull(),
    hostingOrigin: varchar("hosting_origin", { length: 255 }).notNull(),
    usesInternet: boolean("uses_internet").notNull(),
    active: boolean("active").notNull().default(true),
    system: boolean("system").notNull().default(false),
    showInfoBanner: boolean("show_info_banner").notNull().default(false),
    infoBannerText: varchar("info_banner_text", { length: 255 })
      .notNull()
      .default(""),
    infoBannerColor: varchar("info_banner_color", { length: 255 })
      .notNull()
      .default("green"),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_provider_models_organisation_id_idx").on(table.organisationId),
    unique("ai_provider_model_unique").on(
      table.organisationId,
      table.provider,
      table.model
    ),
  ]
);

export type AiProviderModelsSelect = typeof aiProviderModels.$inferSelect;
export type AiProviderModelsInsert = typeof aiProviderModels.$inferInsert;

export const aiProviderModelsSelectSchema =
  createSelectSchema(aiProviderModels);
export const aiProviderModelsInsertSchema =
  createInsertSchema(aiProviderModels);
export const aiProviderModelsUpdateSchema =
  createUpdateSchema(aiProviderModels);

// Relations
export const aiProviderModelsRelations = relations(
  aiProviderModels,
  ({ one }) => ({
    organisation: one(organisations, {
      fields: [aiProviderModels.organisationId],
      references: [organisations.id],
    }),
  })
);
