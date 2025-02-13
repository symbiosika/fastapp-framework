import { sql } from "drizzle-orm";
import {
  uuid,
  timestamp,
  text,
  index,
  unique,
  jsonb,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pgBaseTable } from ".";
import { organisations, teams, users } from "./users";
import { knowledgeText, knowledgeEntry } from "./knowledge";
import { promptTemplates } from "./prompts";
import { chatSessionGroups, chatSessions } from "./chat";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-valibot";
import * as v from "valibot";

// Main workspace table
export const workspaces = pgBaseTable(
  "workspaces",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    parentId: uuid("parentId").references((): AnyPgColumn => workspaces.id, {
      onDelete: "cascade",
    }),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    // One of userId or teamId must be set
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    result: jsonb("result").$type<{
      success?: boolean;
      error?: string;
      text?: string;
    }>(),
    finishedAt: timestamp("finished_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Ensure workspace name is unique per organisation and owner (user or team)
    unique("workspace_name_org_user_unique").on(
      table.name,
      table.organisationId,
      table.userId
    ),
    unique("workspace_name_org_team_unique").on(
      table.name,
      table.organisationId,
      table.teamId
    ),
    index("workspace_organisation_id_idx").on(table.organisationId),
    index("workspace_user_id_idx").on(table.userId),
    index("workspace_team_id_idx").on(table.teamId),
    index("workspace_created_at_idx").on(table.createdAt),
  ]
);

export type WorkspacesSelect = typeof workspaces.$inferSelect;
export type WorkspacesInsert = typeof workspaces.$inferInsert;

export const workspacesSelectSchema = createSelectSchema(workspaces);
export const workspacesInsertSchema = createInsertSchema(workspaces);
export const workspacesUpdateSchema = createUpdateSchema(workspaces);

// Junction table for workspace to knowledge text assignments

export const workspaceKnowledgeTexts = pgBaseTable(
  "workspace_knowledge_texts",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    knowledgeTextId: uuid("knowledge_text_id")
      .notNull()
      .references(() => knowledgeText.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("workspace_knowledge_text_unique").on(
      table.workspaceId,
      table.knowledgeTextId
    ),
    index("workspace_knowledge_texts_workspace_idx").on(table.workspaceId),
  ]
);

export type WorkspaceKnowledgeTextsSelect =
  typeof workspaceKnowledgeTexts.$inferSelect;
export type WorkspaceKnowledgeTextsInsert =
  typeof workspaceKnowledgeTexts.$inferInsert;

export const workspaceKnowledgeTextsSelectSchema = createSelectSchema(
  workspaceKnowledgeTexts
);
export const workspaceKnowledgeTextsInsertSchema = createInsertSchema(
  workspaceKnowledgeTexts
);
export const workspaceKnowledgeTextsUpdateSchema = createUpdateSchema(
  workspaceKnowledgeTexts
);

// Junction table for workspace to knowledge entry assignments

export const workspaceKnowledgeEntries = pgBaseTable(
  "workspace_knowledge_entries",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    knowledgeEntryId: uuid("knowledge_entry_id")
      .notNull()
      .references(() => knowledgeEntry.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("workspace_knowledge_entry_unique").on(
      table.workspaceId,
      table.knowledgeEntryId
    ),
    index("workspace_knowledge_entries_workspace_idx").on(table.workspaceId),
  ]
);

export type WorkspaceKnowledgeEntriesSelect =
  typeof workspaceKnowledgeEntries.$inferSelect;
export type WorkspaceKnowledgeEntriesInsert =
  typeof workspaceKnowledgeEntries.$inferInsert;

export const workspaceKnowledgeEntriesSelectSchema = createSelectSchema(
  workspaceKnowledgeEntries
);
export const workspaceKnowledgeEntriesInsertSchema = createInsertSchema(
  workspaceKnowledgeEntries
);
export const workspaceKnowledgeEntriesUpdateSchema = createUpdateSchema(
  workspaceKnowledgeEntries
);

// Junction table for workspace to prompt template assignments

export const workspacePromptTemplates = pgBaseTable(
  "workspace_prompt_templates",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    promptTemplateId: uuid("prompt_template_id")
      .notNull()
      .references(() => promptTemplates.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("workspace_prompt_template_unique").on(
      table.workspaceId,
      table.promptTemplateId
    ),
    index("workspace_prompt_templates_workspace_idx").on(table.workspaceId),
  ]
);

export type WorkspacePromptTemplatesSelect =
  typeof workspacePromptTemplates.$inferSelect;
export type WorkspacePromptTemplatesInsert =
  typeof workspacePromptTemplates.$inferInsert;

export const workspacePromptTemplatesSelectSchema = createSelectSchema(
  workspacePromptTemplates
);
export const workspacePromptTemplatesInsertSchema = createInsertSchema(
  workspacePromptTemplates
);
export const workspacePromptTemplatesUpdateSchema = createUpdateSchema(
  workspacePromptTemplates
);

// Junction table for workspace to chat group assignments
export const workspaceChatGroups = pgBaseTable(
  "workspace_chat_groups",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    chatGroupId: uuid("chat_group_id")
      .notNull()
      .references(() => chatSessionGroups.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("workspace_chat_group_unique").on(
      table.workspaceId,
      table.chatGroupId
    ),
    index("workspace_chat_groups_workspace_idx").on(table.workspaceId),
  ]
);

export type WorkspaceChatGroupsSelect = typeof workspaceChatGroups.$inferSelect;
export type WorkspaceChatGroupsInsert = typeof workspaceChatGroups.$inferInsert;

export const workspaceChatGroupsSelectSchema =
  createSelectSchema(workspaceChatGroups);
export const workspaceChatGroupsInsertSchema =
  createInsertSchema(workspaceChatGroups);
export const workspaceChatGroupsUpdateSchema =
  createUpdateSchema(workspaceChatGroups);

// Junction table for workspace to chat session assignments

export const workspaceChatSessions = pgBaseTable(
  "workspace_chat_sessions",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    chatSessionId: text("chat_session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("workspace_chat_session_unique").on(
      table.workspaceId,
      table.chatSessionId
    ),
    index("workspace_chat_sessions_workspace_idx").on(table.workspaceId),
  ]
);

export type WorkspaceChatSessionsSelect =
  typeof workspaceChatSessions.$inferSelect;
export type WorkspaceChatSessionsInsert =
  typeof workspaceChatSessions.$inferInsert;

export const workspaceChatSessionsSelectSchema = createSelectSchema(
  workspaceChatSessions
);
export const workspaceChatSessionsInsertSchema = createInsertSchema(
  workspaceChatSessions
);
export const workspaceChatSessionsUpdateSchema = createUpdateSchema(
  workspaceChatSessions
);

// Junction table for workspace to user assignments
export const workspaceUsers = pgBaseTable(
  "workspace_users",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("workspace_user_unique").on(table.workspaceId, table.userId),
    index("workspace_users_workspace_idx").on(table.workspaceId),
  ]
);

export type WorkspaceUsersSelect = typeof workspaceUsers.$inferSelect;
export type WorkspaceUsersInsert = typeof workspaceUsers.$inferInsert;

export const workspaceUsersSelectSchema = createSelectSchema(workspaceUsers);
export const workspaceUsersInsertSchema = createInsertSchema(workspaceUsers);
export const workspaceUsersUpdateSchema = createUpdateSchema(workspaceUsers);

// Relations
export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [workspaces.organisationId],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [workspaces.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [workspaces.teamId],
    references: [teams.id],
  }),
  knowledgeTexts: many(workspaceKnowledgeTexts),
  knowledgeEntries: many(workspaceKnowledgeEntries),
  promptTemplates: many(workspacePromptTemplates),
  chatGroups: many(workspaceChatGroups),
  chatSessions: many(workspaceChatSessions),
  users: many(workspaceUsers),
}));

export const workspaceKnowledgeTextsRelations = relations(
  workspaceKnowledgeTexts,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceKnowledgeTexts.workspaceId],
      references: [workspaces.id],
    }),
    knowledgeText: one(knowledgeText, {
      fields: [workspaceKnowledgeTexts.knowledgeTextId],
      references: [knowledgeText.id],
    }),
  })
);

export const workspaceKnowledgeEntriesRelations = relations(
  workspaceKnowledgeEntries,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceKnowledgeEntries.workspaceId],
      references: [workspaces.id],
    }),
    knowledgeEntry: one(knowledgeEntry, {
      fields: [workspaceKnowledgeEntries.knowledgeEntryId],
      references: [knowledgeEntry.id],
    }),
  })
);

export const workspacePromptTemplatesRelations = relations(
  workspacePromptTemplates,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspacePromptTemplates.workspaceId],
      references: [workspaces.id],
    }),
    promptTemplate: one(promptTemplates, {
      fields: [workspacePromptTemplates.promptTemplateId],
      references: [promptTemplates.id],
    }),
  })
);

export const workspaceChatGroupsRelations = relations(
  workspaceChatGroups,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceChatGroups.workspaceId],
      references: [workspaces.id],
    }),
    chatGroup: one(chatSessionGroups, {
      fields: [workspaceChatGroups.chatGroupId],
      references: [chatSessionGroups.id],
    }),
  })
);

export const workspaceChatSessionsRelations = relations(
  workspaceChatSessions,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceChatSessions.workspaceId],
      references: [workspaces.id],
    }),
    chatSession: one(chatSessions, {
      fields: [workspaceChatSessions.chatSessionId],
      references: [chatSessions.id],
    }),
  })
);

export const workspaceUsersRelations = relations(workspaceUsers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceUsers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceUsers.userId],
    references: [users.id],
  }),
}));

export type CreateWorkspaceInput = WorkspacesInsert & {
  knowledgeTextIds?: string[];
  knowledgeEntryIds?: string[];
  promptTemplateIds?: string[];
  chatGroupIds?: string[];
  chatSessionIds?: string[];
  userIds?: string[];
};

export type WorkspaceRelations = {
  knowledgeTextIds?: string[];
  knowledgeEntryIds?: string[];
  promptTemplateIds?: string[];
  chatGroupIds?: string[];
  chatSessionIds?: string[];
  userIds?: string[];
};

export const WorkspaceRelationsSchema = v.object({
  knowledgeTextIds: v.optional(v.array(v.string())),
  knowledgeEntryIds: v.optional(v.array(v.string())),
  promptTemplateIds: v.optional(v.array(v.string())),
  chatGroupIds: v.optional(v.array(v.string())),
  chatSessionIds: v.optional(v.array(v.string())),
  userIds: v.optional(v.array(v.string())),
});
