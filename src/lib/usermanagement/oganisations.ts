/**
 * CRUD operations for organisations and teams
 */

import { getDb } from "../db/db-connection";
import { eq, and, sql } from "drizzle-orm";
import {
  organisations,
  teams,
  teamMembers,
  userPermissionGroups,
  pathPermissions,
  groupPermissions,
  type OrganisationsSelect,
  type OrganisationsInsert,
  users,
  organisationMembers,
} from "../db/schema/users";

/**
 * Create an organisation
 */
export const createOrganisation = async (data: OrganisationsInsert) => {
  const result = await getDb().insert(organisations).values(data).returning();
  return result[0];
};

/**
 * Get an organisation by its ID
 */
export const getOrganisation = async (orgId: string) => {
  const org = await getDb()
    .select()
    .from(organisations)
    .where(eq(organisations.id, orgId));
  return org[0];
};

/**
 * Update an organisation
 */
export const updateOrganisation = async (
  orgId: string,
  data: Partial<OrganisationsSelect>
) => {
  const result = await getDb()
    .update(organisations)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(organisations.id, orgId))
    .returning();
  return result[0];
};

/**
 * Delete an organisation
 */
export const deleteOrganisation = async (orgId: string) => {
  await getDb().delete(organisations).where(eq(organisations.id, orgId));
};

/**
 * Get all organisations of a user
 */
export const getUserOrganisations = async (userId: string) => {
  return await getDb()
    .select()
    .from(organisationMembers)
    .innerJoin(
      organisations,
      eq(organisations.id, organisationMembers.organisationId)
    )
    .where(eq(organisationMembers.userId, userId));
};

/**
 * Drop the membership of a user from an organisation
 */
export const dropUserFromOrganisation = async (
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

/**
 * Get the last organisation of a user
 */
export const getLastOrganisation = async (userId: string) => {
  const user = await getDb()
    .select({
      userId: users.id,
      lastOrganisationId: users.lastOrganisationId,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user[0]?.lastOrganisationId) return null;

  return await getOrganisation(user[0].lastOrganisationId);
};

/**
 * Set the last organisation of a user
 */
export const setLastOrganisation = async (
  userId: string,
  organisationId: string
) => {
  // Check if user is a member of the organisation
  const membership = await getDb()
    .select()
    .from(organisationMembers)
    .where(
      and(
        eq(organisationMembers.userId, userId),
        eq(organisationMembers.organisationId, organisationId)
      )
    );

  if (!membership.length) {
    throw new Error("User is not a member of this organisation");
  }

  return await getDb()
    .update(users)
    .set({ lastOrganisationId: organisationId })
    .where(eq(users.id, userId))
    .returning();
};

export const getTeamsAndMembersByOrganisation = async (
  organisationId: string
) => {
  return await getDb()
    .select({
      team: teams,
      members: sql<Array<{ userId: string; role: string | null }>>`
        json_agg(
          json_build_object(
            'userId', ${teamMembers.userId},
            'role', ${teamMembers.role}
          )
        )`,
    })
    .from(teams)
    .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(eq(teams.organisationId, organisationId))
    .groupBy(teams.id);
};

export const getPermissionsByOrganisation = async (organisationId: string) => {
  return await getDb()
    .select({
      group: userPermissionGroups,
      permissions: sql<Array<{ id: string; name: string }>>`
        json_agg(
          json_build_object(
            'id', ${pathPermissions.id},
            'name', ${pathPermissions.name}
          )
        )`,
    })
    .from(userPermissionGroups)
    .leftJoin(
      groupPermissions,
      eq(userPermissionGroups.id, groupPermissions.groupId)
    )
    .leftJoin(
      pathPermissions,
      eq(groupPermissions.permissionId, pathPermissions.id)
    )
    .where(eq(userPermissionGroups.organisationId, organisationId))
    .groupBy(userPermissionGroups.id);
};

/**
 * Add a user to an organisation
 */
export const addOrganisationMember = async (
  organisationId: string,
  userId: string,
  role?: string
) => {
  const result = await getDb()
    .insert(organisationMembers)
    .values({
      organisationId,
      userId,
      role,
    })
    .returning();
  return result[0];
};

/**
 * Remove a user from an organisation
 */
export const removeOrganisationMember = async (
  organisationId: string,
  userId: string
) => {
  await getDb()
    .delete(organisationMembers)
    .where(
      and(
        eq(organisationMembers.organisationId, organisationId),
        eq(organisationMembers.userId, userId)
      )
    );
};

/**
 * Get all members of an organisation
 */
export const getOrganisationMembers = async (organisationId: string) => {
  return await getDb()
    .select({
      usersEmail: users.email,
      role: organisationMembers.role,
      joinedAt: organisationMembers.joinedAt,
    })
    .from(organisationMembers)
    .leftJoin(users, eq(organisationMembers.userId, users.id))
    .where(eq(organisationMembers.organisationId, organisationId));
};
