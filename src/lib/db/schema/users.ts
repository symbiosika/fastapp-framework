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
} from "drizzle-orm/pg-core";
import { pgBaseTable } from ".";
import { relations } from "drizzle-orm";
import { activeSubscriptions, purchases } from "./payment";

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
  (users) => ({
    uniqueEmail: uniqueIndex("unique_email").on(users.email),
  })
);

export type UsersSelect = typeof users.$inferSelect;
export type UsersInsert = typeof users.$inferInsert;

export const sessions = pgBaseTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export type SessionsSelect = typeof sessions.$inferSelect;
export type SessionsInsert = typeof sessions.$inferInsert;

// User Groups Table
export const userGroups = pgBaseTable("user_groups", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export type UserGroupsSelect = typeof userGroups.$inferSelect;
export type UserGroupsInsert = typeof userGroups.$inferInsert;

// User Group Members Table
export const userGroupMembers = pgBaseTable(
  "user_group_members",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userGroupId: uuid("user_groups_id")
      .notNull()
      .references(() => userGroups.id, { onDelete: "cascade" }),
  },
  (userGroupMember) => ({
    compositePK: primaryKey({
      columns: [userGroupMember.userId, userGroupMember.userGroupId],
    }),
  })
);

export type UserGroupMembersSelect = typeof userGroupMembers.$inferSelect;
export type UserGroupMembersInsert = typeof userGroupMembers.$inferInsert;

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions), // sessions will be the name in the "with" clause in the query
  userGroupMembers: many(userGroupMembers), // userGroupMembers will be the name in the "with" clause in the query
  activeSubscriptions: many(activeSubscriptions),
  purchases: many(purchases),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const userGroupsRelations = relations(userGroups, ({ many }) => ({
  userGroupMembers: many(userGroupMembers),
}));

export const userGroupMembersRelations = relations(
  userGroupMembers,
  ({ one }) => ({
    users: one(users, {
      fields: [userGroupMembers.userId],
      references: [users.id],
    }),
    userGroups: one(userGroups, {
      fields: [userGroupMembers.userGroupId],
      references: [userGroups.id],
    }),
  })
);

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
  (magicLinkSession) => ({
    uniqueToken: uniqueIndex("unique_token").on(magicLinkSession.token),
  })
);

export type MagicLinkSessionsSelect = typeof magicLinkSessions.$inferSelect;
export type MagicLinkSessionsInsert = typeof magicLinkSessions.$inferInsert;
