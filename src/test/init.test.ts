import { nanoid } from "nanoid";
import { generateJwt, saltAndHashPassword } from "../lib/auth";
import { createDatabaseClient, getDb } from "../lib/db/db-connection";
import { waitForDbConnection } from "../lib/db/db-connection";
import { products, users } from "../lib/db/db-schema";
import type { UsersEntity } from "../lib/types/shared/db/users";
import { eq } from "drizzle-orm";

export const testProductId = "prod_RBdEBlCP5LtR3O";
export const testPriceId = "price_1QJFyIISOodfhgtvh0yJbAyt";

export const initTests = async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  const randomPassword = nanoid(24);
  const hash = await saltAndHashPassword(randomPassword);

  await getDb().delete(users).where(eq(users.email, "newuser@example.com"));
  await getDb().delete(products).where(eq(products.prodId, testProductId));

  await getDb()
    .insert(users)
    .values({
      id: "00000000-0000-0000-0000-000000000000",
      email: "admin@symbiosika.com",
      firstname: "",
      surname: "",
      emailVerified: true,
      password: hash,
    })
    .onConflictDoUpdate({
      target: [users.id],
      set: {
        email: "admin@symbiosika.com",
        firstname: "",
        surname: "",
        password: hash,
        emailVerified: true,
      },
    });

  const { token } = await generateJwt(
    {
      email: "",
      id: "00000000-0000-0000-0000-000000000000",
    } as UsersEntity,
    86400
  );
  return {
    token,
    password: randomPassword,
  };
};
