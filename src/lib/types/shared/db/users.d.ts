/*
import type { users } from "../../../lib/db/schema/users";
type UsersEntity = typeof users.$inferSelect;
type InsertUsersEntity = typeof users.$inferInsert;
*/

export type UsersEntity = {
  id: string;
  email: string;
  emailVerified: Date | null;
  password: string | null;
  salt: string | null;
  image: string | null;
  firstname: string;
  surname: string;
  createdAt: string;
  updatedAt: string;
  extUserId: string;
};

export type InsertUsersEntity = {
  email: string;
  firstname: string;
  surname: string;
  extUserId: string;
  id?: string | undefined;
  emailVerified?: Date | null | undefined;
  password?: string | null | undefined;
  salt?: string | null | undefined;
  image?: string | null | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
};
