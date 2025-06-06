import {
  text,
  timestamp,
  jsonb,
  index,
  uuid,
  varchar,
  check,
} from "drizzle-orm/pg-core";
import { pgBaseTable } from ".";
import { relations, sql } from "drizzle-orm";
import { organisations, teams, users } from "./users";
import { workspaceChatSessions, workspaces } from "./workspaces";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-valibot";

// Table to store chat sessions
export const chatSessions = pgBaseTable(
  "chat_sessions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    organisationId: uuid("organisation_id").references(() => organisations.id, {
      onDelete: "cascade",
    }),
    messages: jsonb("messages").notNull(),
    state: jsonb("state").notNull(),
    chatSessionGroupId: uuid("chat_session_group_id").references(
      () => chatSessionGroups.id,
      { onDelete: "cascade" }
    ),
    // if a chat has a delete date it can be dropped by a cron job
    deleteAt: timestamp("delete_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (chatSessions) => [
    index("chat_sessions_updated_at_idx").on(chatSessions.updatedAt),
    check("chat_sessions_name_min_length", sql`length("name") >= 1`),
  ]
);

export type ChatSessionsSelect = typeof chatSessions.$inferSelect;
export type ChatSessionsInsert = typeof chatSessions.$inferInsert;
export type ChatSessionsUpdate = Partial<ChatSessionsInsert>;

export const chatSessionsSelectSchema = createSelectSchema(chatSessions);
export const chatSessionsInsertSchema = createInsertSchema(chatSessions);
export const chatSessionsUpdateSchema = createUpdateSchema(chatSessions);

// Table to organize chat sessions into simple groups

export const chatSessionGroups = pgBaseTable(
  "chat_session_groups",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    meta: jsonb("meta"),
    organisationId: uuid("organisation_id")
      .references(() => organisations.id, {
        onDelete: "cascade",
      })
      .notNull(),
    // optional team id to organize chats into teams
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    // optional workspace id to organize chats into workspaces
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },

  (chatSessionGroups) => [
    index("chat_session_groups_organisation_id_idx").on(
      chatSessionGroups.organisationId
    ),
    index("chat_session_groups_team_id_idx").on(chatSessionGroups.teamId),
    index("chat_session_groups_workspace_id_idx").on(
      chatSessionGroups.workspaceId
    ),
    check("chat_session_groups_name_min_length", sql`length("name") >= 1`),
  ]
);

export type ChatSessionGroupsSelect = typeof chatSessionGroups.$inferSelect;
export type ChatSessionGroupsInsert = typeof chatSessionGroups.$inferInsert;
export type ChatSessionGroupsUpdate = Partial<ChatSessionGroupsInsert>;

export const chatSessionGroupsSelectSchema =
  createSelectSchema(chatSessionGroups);
export const chatSessionGroupsInsertSchema =
  createInsertSchema(chatSessionGroups);
export const chatSessionGroupsUpdateSchema =
  createUpdateSchema(chatSessionGroups);

// Table to assign users to chat session groups

export const chatSessionGroupAssignments = pgBaseTable(
  "chat_session_group_assignments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    chatSessionGroupId: uuid("chat_session_group_id")
      .references(() => chatSessionGroups.id, {
        onDelete: "cascade",
      })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  },
  (chatSessionGroupAssignments) => [
    index("chat_session_group_assignments_chat_session_group_id_idx").on(
      chatSessionGroupAssignments.chatSessionGroupId
    ),
    index("chat_session_group_assignments_user_id_idx").on(
      chatSessionGroupAssignments.userId
    ),
  ]
);

export type ChatSessionGroupAssignmentsSelect =
  typeof chatSessionGroupAssignments.$inferSelect;
export type ChatSessionGroupAssignmentsInsert =
  typeof chatSessionGroupAssignments.$inferInsert;
export type ChatSessionGroupAssignmentsUpdate =
  Partial<ChatSessionGroupAssignmentsInsert>;

export const chatSessionGroupAssignmentsSelectSchema = createSelectSchema(
  chatSessionGroupAssignments
);
export const chatSessionGroupAssignmentsInsertSchema = createInsertSchema(
  chatSessionGroupAssignments
);
export const chatSessionGroupAssignmentsUpdateSchema = createUpdateSchema(
  chatSessionGroupAssignments
);

// Relations

export const chatSessionGroupRelations = relations(
  chatSessionGroups,
  ({ one, many }) => ({
    organisation: one(organisations, {
      fields: [chatSessionGroups.organisationId],
      references: [organisations.id],
    }),
    team: one(teams, {
      fields: [chatSessionGroups.teamId],
      references: [teams.id],
    }),
    chats: many(chatSessions),
    workspace: one(workspaces, {
      fields: [chatSessionGroups.workspaceId],
      references: [workspaces.id],
    }),
    assignments: many(chatSessionGroupAssignments),
  })
);

export const chatSessionGroupAssignmentRelations = relations(
  chatSessionGroupAssignments,
  ({ one }) => ({
    chatSessionGroup: one(chatSessionGroups, {
      fields: [chatSessionGroupAssignments.chatSessionGroupId],
      references: [chatSessionGroups.id],
    }),
    user: one(users, {
      fields: [chatSessionGroupAssignments.userId],
      references: [users.id],
    }),
  })
);

export const chatSessionRelations = relations(
  chatSessions,
  ({ one, many }) => ({
    organisation: one(organisations, {
      fields: [chatSessions.organisationId],
      references: [organisations.id],
    }),
    user: one(users, {
      fields: [chatSessions.userId],
      references: [users.id],
    }),
    chatSessionGroup: one(chatSessionGroups, {
      fields: [chatSessions.chatSessionGroupId],
      references: [chatSessionGroups.id],
    }),
    workspaceChatSessions: many(workspaceChatSessions),
  })
);
