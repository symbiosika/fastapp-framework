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
  teamMembers,
  organisationMembers,
} from "../lib/db/db-schema";
import { eq, inArray } from "drizzle-orm";
import { addOrganisationMember } from "../lib/usermanagement/oganisations";

/**
 * TEST DATA
 */

export const testProductId = "prod_RBdEBlCP5LtR3O";
export const testPriceId = "price_1QJFyIISOodfhgtvh0yJbAyt";

export const TEST_ADMIN_USER_EMAIL = "admin@symbiosika.com";
export const TEST_ADMIN_USER_PASSWORD = "gFskj6Dn6gFskj6Dn6";

export const TEST_ADMIN_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  email: TEST_ADMIN_USER_EMAIL,
  firstname: "Joe",
  surname: "Doe",
  password: TEST_ADMIN_USER_PASSWORD,
};

export const TEST_ORGANISATION_1 = {
  id: "00000000-1111-1111-1111-000000000001",
  name: "Test Organisation 1",
};

export const TEST_ORGANISATION_2 = {
  id: "00000000-1111-1111-1111-000000000002",
  name: "Test Organisation 2",
};

export const TEST_ORGANISATION_3 = {
  id: "00000000-1111-1111-1111-000000000003",
  name: "Test Organisation 3",
};

export const TEST_ORGANISATIONS = [
  TEST_ORGANISATION_1,
  TEST_ORGANISATION_2,
  TEST_ORGANISATION_3,
];

export const TEST_USER_1 = {
  id: "00000000-2222-2222-2222-000000000001",
  email: "testuser1@symbiosika.com",
  firstname: "Test",
  surname: "User 1",
  password: "gFskj6Dn6gFskj6Dn6",
};

export const TEST_USER_2 = {
  id: "00000000-2222-2222-2222-000000000002",
  email: "testuser2@symbiosika.com",
  firstname: "Test",
  surname: "User 2",
  password: "gFskj6Dn6gFskj6Dn6",
};

export const TEST_USER_3 = {
  id: "00000000-2222-2222-2222-000000000003",
  email: "testuser3@symbiosika.com",
  firstname: "Test",
  surname: "User 3",
  password: "gFskj6Dn6gFskj6Dn6",
};

export const TEST_USERS = [TEST_USER_1, TEST_USER_2, TEST_USER_3];

/**
 * Init actions
 */

export const initTestOrganisation = async () => {
  for (const org of TEST_ORGANISATIONS) {
    await getDb()
      .insert(organisations)
      .values({
        id: org.id,
        name: org.name,
      })
      .onConflictDoUpdate({
        target: [organisations.id],
        set: {
          name: org.name,
        },
      });
  }
};

export const dropAllTestOrganisationMembers = async () => {
  await getDb()
    .delete(organisationMembers)
    .where(
      inArray(organisationMembers.userId, [
        TEST_USER_1.id,
        TEST_USER_2.id,
        TEST_USER_3.id,
      ])
    );
};

export const dropAllTestTeamMembers = async () => {
  await getDb()
    .delete(teamMembers)
    .where(
      inArray(teamMembers.userId, [
        TEST_USER_1.id,
        TEST_USER_2.id,
        TEST_USER_3.id,
      ])
    );
};

export const initTestUsers = async () => {
  for (const user of TEST_USERS) {
    const hash = await saltAndHashPassword(user.password);
    await getDb()
      .insert(users)
      .values({
        ...user,
        password: hash,
        emailVerified: true,
      })
      .onConflictDoUpdate({
        target: [users.id],
        set: {
          password: hash,
          emailVerified: true,
        },
      });
  }
};

export const initTestOrganisationMembers = async () => {
  await dropAllTestOrganisationMembers();
  await dropAllTestTeamMembers();

  // delte all old memberships
  await getDb()
    .delete(organisationMembers)
    .where(
      inArray(organisationMembers.userId, [
        TEST_USER_1.id,
        TEST_USER_2.id,
        TEST_USER_3.id,
      ])
    );

  await addOrganisationMember(TEST_ORGANISATION_1.id, TEST_USER_1.id, "owner");
  await addOrganisationMember(TEST_ORGANISATION_2.id, TEST_USER_2.id, "owner");
  await addOrganisationMember(TEST_ORGANISATION_3.id, TEST_USER_3.id, "owner");
};

export const getJwtTokenForTesting = async (userNumber: number) => {
  if (userNumber < 1 || userNumber > 3) {
    throw new Error("Invalid user number");
  }
  const user = TEST_USERS[userNumber - 1];
  const { token } = await generateJwt(
    {
      email: user.email,
      id: user.id,
    } as UsersSelect,
    86400
  );
  return token;
};

/**
 * Init global test data
 */

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
      id: TEST_ADMIN_USER.id,
      email: TEST_ADMIN_USER.email,
      firstname: TEST_ADMIN_USER.firstname,
      surname: TEST_ADMIN_USER.surname,
      emailVerified: true,
      password: hash,
    })
    .onConflictDoUpdate({
      target: [users.id],
      set: {
        email: TEST_ADMIN_USER.email,
        firstname: TEST_ADMIN_USER.firstname,
        surname: TEST_ADMIN_USER.surname,
        password: hash,
        emailVerified: true,
      },
    });

  const { token } = await generateJwt(
    {
      email: TEST_ADMIN_USER.email,
      id: TEST_ADMIN_USER.id,
    } as UsersSelect,
    86400
  );

  await initTestOrganisation().catch((err) => {
    console.info("Error initialising test organisation", err);
  });
  await initTestUsers().catch((err) => {
    console.info("Error initialising test users", err);
  });
  await initTestOrganisationMembers().catch((err) => {
    console.info("Error initialising test organisation members", err);
  });

  return {
    token,
    password: TEST_ADMIN_USER_PASSWORD,
  };
};
