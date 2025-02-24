import { nanoid } from "nanoid";
import { generateJwt, saltAndHashPassword } from "../lib/auth";
import { createDatabaseClient, getDb } from "../lib/db/db-connection";
import { waitForDbConnection } from "../lib/db/db-connection";
import {
  jobs,
  products,
  users,
  organisations,
  type UsersSelect,
} from "../lib/db/db-schema";
import { eq } from "drizzle-orm";

export const testProductId = "prod_RBdEBlCP5LtR3O";
export const testPriceId = "price_1QJFyIISOodfhgtvh0yJbAyt";

export const TEST_ORGANISATION_ID = "00000000-1111-1111-1111-000000000000";

export const TEST_ADMIN_USER_EMAIL = "admin@symbiosika.com";
export const TEST_ADMIN_USER_PASSWORD = "gFskj6Dn6gFskj6Dn6";

export const initTests = async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  // const randomPassword = nanoid(24);
  const hash = await saltAndHashPassword(TEST_ADMIN_USER_PASSWORD);

  // delete old test data
  await getDb().delete(users).where(eq(users.email, "newuser@example.com"));
  await getDb().delete(products).where(eq(products.prodId, testProductId));
  await getDb().delete(jobs).where(eq(jobs.type, "test-job"));

  await getDb()
    .insert(users)
    .values({
      id: "00000000-0000-0000-0000-000000000000",
      email: TEST_ADMIN_USER_EMAIL,
      firstname: "Joe",
      surname: "Doe",
      emailVerified: true,
      password: hash,
    })
    .onConflictDoUpdate({
      target: [users.id],
      set: {
        email: TEST_ADMIN_USER_EMAIL,
        firstname: "Joe",
        surname: "Doe",
        password: hash,
        emailVerified: true,
      },
    });

  const { token } = await generateJwt(
    {
      email: TEST_ADMIN_USER_EMAIL,
      id: "00000000-0000-0000-0000-000000000000",
    } as UsersSelect,
    86400
  );
  return {
    token,
    password: TEST_ADMIN_USER_PASSWORD,
  };
};

export const initTestOrganisation = async () => {
  const organisationId = "00000000-1111-1111-1111-000000000000";

  // Assuming you have an 'organisations' table and a corresponding entity
  await getDb()
    .insert(organisations)
    .values({
      id: organisationId,
      name: "Test Organisation",
      // Add other necessary fields here
    })
    .onConflictDoUpdate({
      target: [organisations.id],
      set: {
        name: "Test Organisation",
        // Update other necessary fields here
      },
    });

  return {
    organisationId,
  };
};
