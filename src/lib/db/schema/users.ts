/**
 * Schema definition for users and its direct related tables.
 */

import { sql } from "drizzle-orm";
import {
  jsonb,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  boolean,
  index,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { pgBaseTable } from ".";
import { relations } from "drizzle-orm";
import { activeSubscriptions, purchases } from "./payment";
import { promptSnippets } from "./prompts";
import { chatSessions } from "./chat";

export const organisations = pgBaseTable(
  "organisations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (organisations) => [unique("organisations_name_idx").on(organisations.name)]
);

export type OrganisationsSelect = typeof organisations.$inferSelect;
export type OrganisationsInsert = typeof organisations.$inferInsert;

export const users = pgBaseTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    password: text("password"),
    salt: text("salt"),
    image: text("image"),
    firstname: varchar("firstname", { length: 255 }).notNull(),
    surname: varchar("surname", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    extUserId: text("ext_user_id").notNull().default(""),
    meta: jsonb("meta"),
  },
  (users) => [
    index("users_email_idx").on(users.email),
    uniqueIndex("unique_email").on(users.email),
    index("users_created_at_idx").on(users.createdAt),
    index("users_updated_at_idx").on(users.updatedAt),
    index("users_email_verified_idx").on(users.emailVerified),
  ]
);

export type UsersSelect = typeof users.$inferSelect;
export type UsersInsert = typeof users.$inferInsert;

export const sessions = pgBaseTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "string" }).notNull(),
  },
  (sessions) => [
    index("sessions_user_id_idx").on(sessions.userId),
    index("sessions_expires_idx").on(sessions.expires),
  ]
);

export type SessionsSelect = typeof sessions.$inferSelect;
export type SessionsInsert = typeof sessions.$inferInsert;

// User Permission Groups Table
export const userPermissionGroups = pgBaseTable(
  "user_permission_groups",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    organisationId: uuid("organisation_id").references(() => organisations.id, {
      onDelete: "cascade",
    }),
  },
  (userPermissionGroups) => [
    index("user_permission_groups_name_idx").on(userPermissionGroups.name),
    index("user_permission_groups_created_at_idx").on(
      userPermissionGroups.createdAt
    ),
  ]
);

export type UserPermissionGroupsSelect =
  typeof userPermissionGroups.$inferSelect;
export type UserPermissionGroupsInsert =
  typeof userPermissionGroups.$inferInsert;

// User Group Members Table
export const userGroupMembers = pgBaseTable(
  "user_group_members",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userGroupId: uuid("user_groups_id")
      .notNull()
      .references(() => userPermissionGroups.id, { onDelete: "cascade" }),
  },
  (userGroupMember) => [
    primaryKey({
      columns: [userGroupMember.userId, userGroupMember.userGroupId],
    }),
  ]
);

export type UserGroupMembersSelect = typeof userGroupMembers.$inferSelect;
export type UserGroupMembersInsert = typeof userGroupMembers.$inferInsert;

// Table "MagicLink Sessions"
export const magicLinkSessions = pgBaseTable(
  "magic_link_sessions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    token: text("token").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (magicLinkSession) => [
    uniqueIndex("unique_token").on(magicLinkSession.token),
    index("magic_link_sessions_user_id_idx").on(magicLinkSession.userId),
    index("magic_link_sessions_expires_at_idx").on(magicLinkSession.expiresAt),
  ]
);

export type MagicLinkSessionsSelect = typeof magicLinkSessions.$inferSelect;
export type MagicLinkSessionsInsert = typeof magicLinkSessions.$inferInsert;

// Permission Type Enum
export const permissionTypeEnum = pgEnum("permission_type", ["regex"]);

// Path Permissions Table
export const pathPermissions = pgBaseTable(
  "path_permissions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    system: boolean("system").notNull().default(false), // if the permission is system-wide
    category: varchar("category", { length: 255 }).notNull(), // a category for the permission. e.g. "manage-teams"
    name: varchar("name", { length: 255 }).notNull(), // a unique name for the permission
    description: text("description"), // optional description for the permission
    type: permissionTypeEnum("type").notNull().default("regex"), // at the moment only regex is supported
    method: varchar("method", { length: 10 }).notNull(), // GET, POST, DELETE, PUT
    pathExpression: text("path_expression").notNull(), // e.g. "^/api/.*$"
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    organisationId: uuid("organisation_id").references(() => organisations.id, {
      onDelete: "cascade",
    }), // optional
  },
  (permissions) => [
    unique("unique_category_name").on(permissions.category, permissions.name),
    index("permissions_method_idx").on(permissions.method),
    index("permissions_type_idx").on(permissions.type),
  ]
);

export type PathPermissionsSelect = typeof pathPermissions.$inferSelect;
export type PathPermissionsInsert = typeof pathPermissions.$inferInsert;

// Group to Permission Table
export const groupPermissions = pgBaseTable(
  "group_permissions",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => userPermissionGroups.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => pathPermissions.id, { onDelete: "cascade" }),
  },
  (groupPermissions) => [
    primaryKey({
      columns: [groupPermissions.groupId, groupPermissions.permissionId],
    }),
    index("group_permissions_group_id_idx").on(groupPermissions.groupId),
    index("group_permissions_permission_id_idx").on(
      groupPermissions.permissionId
    ),
  ]
);

export type GroupPermissionsSelect = typeof groupPermissions.$inferSelect;
export type GroupPermissionsInsert = typeof groupPermissions.$inferInsert;

// Teams Table
export const teams = pgBaseTable(
  "teams",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
  },
  (teams) => [unique("teams_name_idx").on(teams.name)]
);

export type TeamsSelect = typeof teams.$inferSelect;
export type TeamsInsert = typeof teams.$inferInsert;

// Team Members Table mit optionaler Rolle
export const teamMembers = pgBaseTable(
  "team_members",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }), // z.B. 'admin', 'member', etc.
    joinedAt: timestamp("joined_at", { mode: "string" }).notNull().defaultNow(),
  },
  (teamMembers) => [
    primaryKey({
      columns: [teamMembers.userId, teamMembers.teamId],
    }),
  ]
);

// RELATIONS

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  userGroupMembers: many(userGroupMembers),
  activeSubscriptions: many(activeSubscriptions),
  purchases: many(purchases),
  promptSnippets: many(promptSnippets),
  teamMembers: many(teamMembers),
  chatSessions: many(chatSessions),
  organisationMembers: many(organisationMembers),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const pathPermissionsRelations = relations(
  pathPermissions,
  ({ many, one }) => ({
    groupPermissions: many(groupPermissions),
    organisation: one(organisations, {
      fields: [pathPermissions.organisationId],
      references: [organisations.id],
    }),
  })
);

export const userPermissionGroupsRelations = relations(
  userPermissionGroups,
  ({ many, one }) => ({
    userGroupMembers: many(userGroupMembers),
    groupPermissions: many(groupPermissions),
    organisation: one(organisations, {
      fields: [userPermissionGroups.organisationId],
      references: [organisations.id],
    }),
  })
);

export const userGroupMembersRelations = relations(
  userGroupMembers,
  ({ one }) => ({
    users: one(users, {
      fields: [userGroupMembers.userId],
      references: [users.id],
    }),
    userPermissionGroups: one(userPermissionGroups, {
      fields: [userGroupMembers.userGroupId],
      references: [userPermissionGroups.id],
    }),
  })
);

export const groupPermissionsRelations = relations(
  groupPermissions,
  ({ one }) => ({
    group: one(userPermissionGroups, {
      fields: [groupPermissions.groupId],
      references: [userPermissionGroups.id],
    }),
    permission: one(pathPermissions, {
      fields: [groupPermissions.permissionId],
      references: [pathPermissions.id],
    }),
  })
);

export const teamsRelations = relations(teams, ({ many, one }) => ({
  teamMembers: many(teamMembers),
  organisation: one(organisations, {
    fields: [teams.organisationId],
    references: [organisations.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const organisationInvitationStatusEnum = pgEnum(
  "organisation_invitation_status",
  ["pending", "accepted", "declined"]
);

export const organisationInvitations = pgBaseTable(
  "organisation_invitations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: text("email").notNull(), // cannot be the userId since a user is maybe not registered yet
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // Status der Einladung: pending, accepted, declined
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (organisationInvitations) => [
    uniqueIndex("unique_invitation").on(
      organisationInvitations.email,
      organisationInvitations.organisationId
    ),
    index("invitations_status_idx").on(organisationInvitations.status),
    index("invitations_created_at_idx").on(organisationInvitations.createdAt),
    index("invitations_email_idx").on(organisationInvitations.email),
  ]
);

export type OrganisationInvitationsSelect =
  typeof organisationInvitations.$inferSelect;
export type OrganisationInvitationsInsert =
  typeof organisationInvitations.$inferInsert;

export const organisationMembers = pgBaseTable(
  "organisation_members",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("member"), // z.B. 'owner', 'admin', 'member'
    joinedAt: timestamp("joined_at", { mode: "string" }).notNull().defaultNow(),
  },
  (organisationMembers) => [
    primaryKey({
      columns: [organisationMembers.userId, organisationMembers.organisationId],
    }),
    index("organisation_members_user_id_idx").on(organisationMembers.userId),
    index("organisation_members_organisation_id_idx").on(
      organisationMembers.organisationId
    ),
  ]
);

export type OrganisationMembersSelect = typeof organisationMembers.$inferSelect;
export type OrganisationMembersInsert = typeof organisationMembers.$inferInsert;

// Neue Beziehungen für organisationMembers
export const organisationMembersRelations = relations(
  organisationMembers,
  ({ one }) => ({
    user: one(users, {
      fields: [organisationMembers.userId],
      references: [users.id],
    }),
    organisation: one(organisations, {
      fields: [organisationMembers.organisationId],
      references: [organisations.id],
    }),
  })
);
