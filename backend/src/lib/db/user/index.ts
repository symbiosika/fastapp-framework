import { getDb } from "../db-connection";
import { eq } from "drizzle-orm";
import { users } from "../db-schema";
import type { UsersEntity } from "../../types/shared/db/users";

export const getUser = async (userId: string) => {
  const user = await getDb()
    .select()
    .from(users)
    .where(eq(users.extUserId, userId));
  return user[0] ?? undefined;
};

export const getUserById = async (userId: string) => {
  const user = await getDb()
    .select({
      id: users.id,
      extUserId: users.extUserId,
      email: users.email,
      emailVerified: users.emailVerified,
      image: users.image,
      firstname: users.firstname,
      surname: users.surname,
    })
    .from(users)
    .where(eq(users.id, userId));
  return user[0] ?? undefined;
};

export const getUserByEmail = async (email: string) => {
  const user = await getDb().select().from(users).where(eq(users.email, email));
  return user[0] ?? undefined;
};

export const updateUser = async (
  userId: string,
  data: Partial<UsersEntity>
) => {
  await getDb().update(users).set(data).where(eq(users.id, userId));
};
