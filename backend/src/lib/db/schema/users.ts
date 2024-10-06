/**
 * Schema definition for users and its direct related tables.
 */

import { sql } from "drizzle-orm";
import {
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { pgBaseTable } from ".";
import { relations } from "drizzle-orm";
import { activeSubscriptions, oneTimePurchases } from "./payment";

export const users = pgBaseTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  password: text("password"),
  salt: text("salt"),
  image: text("image"),
  firstname: varchar("firstname", { length: 255 }).notNull(),
  surname: varchar("surname", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  extUserId: text("ext_user_id").notNull(),
});

export const sessions = pgBaseTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// User Groups Table
export const userGroups = pgBaseTable("user_groups", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

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

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions), // sessions will be the name in the "with" clause in the query
  userGroupMembers: many(userGroupMembers), // userGroupMembers will be the name in the "with" clause in the query
  activeSubscriptions: many(activeSubscriptions),
  oneTimePurchases: many(oneTimePurchases),
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
