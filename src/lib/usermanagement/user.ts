import { getDb } from "../db/db-connection";
import { eq, and } from "drizzle-orm";
import {
  users,
  organisationMembers,
  organisations,
  teamMembers,
  teams,
  type UsersInsert,
} from "../db/schema/users";

export const getUser = async (userId: string) => {
  const user = await getDb()
    .select({
      id: users.id,
    })
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
      profileImageName: users.profileImageName,
      firstname: users.firstname,
      surname: users.surname,
      meta: users.meta,
      lastOrganisationId: users.lastOrganisationId,
      phoneNumber: users.phoneNumber,
      phoneNumberAsNumber: users.phoneNumberAsNumber,
      phoneNumberVerified: users.phoneNumberVerified,
      phonePinNumber: users.phonePinNumber,
    })
    .from(users)
    .where(eq(users.id, userId));
  return user[0] ?? undefined;
};

export const getUserByEmail = async (
  email: string,
  organisationId?: string
) => {
  const q = getDb()
    .select({
      id: users.id,
      email: users.email,
      firstname: users.firstname,
      surname: users.surname,
    })
    .from(users)
    .where(eq(users.email, email))
    .$dynamic();

  if (organisationId) {
    q.innerJoin(
      organisationMembers,
      and(
        eq(organisationMembers.userId, users.id),
        eq(organisationMembers.organisationId, organisationId)
      )
    );
  }

  const user = await q;

  if (!user[0]) throw new Error("User not found");
  return user[0];
};

export const updateUser = async (
  userId: string,
  data: Partial<UsersInsert>
) => {
  let phoneNumberAsNumber: number | undefined;
  if (data.phoneNumber) {
    phoneNumberAsNumber = parseInt(data.phoneNumber);
  }
  await getDb()
    .update(users)
    .set({
      ...data,
      phoneNumberAsNumber,
    })
    .where(eq(users.id, userId));
};

export const getUserOrganisations = async (userId: string) => {
  return await getDb()
    .select({
      organisationId: organisations.id,
      name: organisations.name,
      role: organisationMembers.role,
      joinedAt: organisationMembers.joinedAt,
    })
    .from(organisationMembers)
    .innerJoin(
      organisations,
      eq(organisations.id, organisationMembers.organisationId)
    )
    .where(eq(organisationMembers.userId, userId));
};

export const addUserToOrganisation = async (
  userId: string,
  organisationId: string,
  role: "admin" | "member" | "owner" = "member"
) => {
  await getDb().insert(organisationMembers).values({
    userId,
    organisationId,
    role,
  });
};

export const removeUserFromOrganisation = async (
  userId: string,
  organisationId: string
) => {
  await getDb()
    .delete(organisationMembers)
    .where(
      and(
        eq(organisationMembers.userId, userId),
        eq(organisationMembers.organisationId, organisationId)
      )
    );
};

export const getUserTeams = async (userId: string) => {
  return await getDb()
    .select({
      teamId: teams.id,
      teamName: teams.name,
      organisationId: teams.organisationId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, userId));
};

export const addUserToTeam = async (
  userId: string,
  teamId: string,
  role: "admin" | "member" = "member"
) => {
  await getDb().insert(teamMembers).values({
    userId,
    teamId,
    role,
  });
};

export const removeUserFromTeam = async (userId: string, teamId: string) => {
  await getDb()
    .delete(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)));
};

export const setUsersLastOrganisation = async (
  userId: string,
  organisationId?: string
) => {
  const usersOrganisations = await getUserOrganisations(userId);

  if (
    organisationId &&
    usersOrganisations.some((org) => org.organisationId === organisationId)
  ) {
    await getDb()
      .update(users)
      .set({ lastOrganisationId: organisationId })
      .where(eq(users.id, userId));
  } else {
    if (usersOrganisations.length > 0) {
      await getDb()
        .update(users)
        .set({ lastOrganisationId: usersOrganisations[0].organisationId })
        .where(eq(users.id, userId));
    } else {
      await getDb()
        .update(users)
        .set({ lastOrganisationId: null })
        .where(eq(users.id, userId));
    }
  }
};

export const setAnotherOrganisationAsLast = async (
  userId: string,
  organisationIdThatCannotBeLast: string
) => {
  const usersLastOrganisation = await getDb()
    .select({
      lastOrganisationId: users.lastOrganisationId,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (
    usersLastOrganisation[0]?.lastOrganisationId ===
    organisationIdThatCannotBeLast
  ) {
    await setUsersLastOrganisation(userId);
  }
};
