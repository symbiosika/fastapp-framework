import { text, timestamp, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { pgBaseTable } from ".";
import { relations, sql } from "drizzle-orm";
import { organisations, teams, users } from "./users";

// Table to store chat sessions
export const chatSessions = pgBaseTable(
  "chat_sessions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
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
  },
  (chatSessions) => [
    index("chat_sessions_updated_at_idx").on(chatSessions.updatedAt),
  ]
);

export type ChatSessionsSelect = typeof chatSessions.$inferSelect;
export type ChatSessionsInsert = typeof chatSessions.$inferInsert;
export type ChatSessionsUpdate = Partial<ChatSessionsInsert>;

// Table to organize chat sessions into simple groups
export const chatSessionGroups = pgBaseTable(
  "chat_session_groups",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    meta: jsonb("meta"),
    organisationId: uuid("organisation_id")
      .references(() => organisations.id, {
        onDelete: "cascade",
      })
      .notNull(),
    // optional team id to organize chats into teams
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (chatSessionGroups) => [
    index("chat_session_groups_organisation_id_idx").on(
      chatSessionGroups.organisationId
    ),
    index("chat_session_groups_team_id_idx").on(chatSessionGroups.teamId),
  ]
);

export type ChatSessionGroupsSelect = typeof chatSessionGroups.$inferSelect;
export type ChatSessionGroupsInsert = typeof chatSessionGroups.$inferInsert;
export type ChatSessionGroupsUpdate = Partial<ChatSessionGroupsInsert>;

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

// Relations
export const chatSessionGroupRelations = relations(
  chatSessionGroups,
  ({ one }) => ({
    organisation: one(organisations, {
      fields: [chatSessionGroups.organisationId],
      references: [organisations.id],
    }),
    team: one(teams, {
      fields: [chatSessionGroups.teamId],
      references: [teams.id],
    }),
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

export const chatSessionRelations = relations(chatSessions, ({ one }) => ({
  organisation: one(organisations, {
    fields: [chatSessions.organisationId],
    references: [organisations.id],
  }),
}));
