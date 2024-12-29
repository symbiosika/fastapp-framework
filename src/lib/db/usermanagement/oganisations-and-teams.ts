import { getDb } from "../db-connection";
import { eq, and } from "drizzle-orm";
import {
  organisations,
  teams,
  teamMembers,
  userPermissionGroups,
  pathPermissions,
  groupPermissions,
  type OrganisationsSelect,
  type TeamsSelect,
  type UserPermissionGroupsSelect,
  type PathPermissionsSelect,
  OrganisationsInsert,
  TeamsInsert,
  UserPermissionGroupsInsert,
  PathPermissionsInsert,
} from "../schema/users";

// Organisation CRUD
export const createOrganisation = async (data: OrganisationsInsert) => {
  const result = await getDb().insert(organisations).values(data).returning();
  return result[0];
};

export const getOrganisation = async (orgId: string) => {
  const org = await getDb()
    .select()
    .from(organisations)
    .where(eq(organisations.id, orgId));
  return org[0];
};

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

export const deleteOrganisation = async (orgId: string) => {
  await getDb().delete(organisations).where(eq(organisations.id, orgId));
};

// Team CRUD
export const createTeam = async (data: TeamsInsert) => {
  const result = await getDb().insert(teams).values(data).returning();
  return result[0];
};

export const getTeam = async (teamId: string) => {
  const team = await getDb().select().from(teams).where(eq(teams.id, teamId));
  return team[0];
};

export const getTeamsByOrganisation = async (orgId: string) => {
  return await getDb()
    .select()
    .from(teams)
    .where(eq(teams.organisationId, orgId));
};

export const updateTeam = async (
  teamId: string,
  data: Partial<TeamsSelect>
) => {
  const result = await getDb()
    .update(teams)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(teams.id, teamId))
    .returning();
  return result[0];
};

export const deleteTeam = async (teamId: string) => {
  await getDb().delete(teams).where(eq(teams.id, teamId));
};

// Team Members Management
export const addTeamMember = async (
  teamId: string,
  userId: string,
  role?: string
) => {
  const result = await getDb()
    .insert(teamMembers)
    .values({
      teamId,
      userId,
      role,
    })
    .returning();
  return result[0];
};

export const removeTeamMember = async (teamId: string, userId: string) => {
  await getDb()
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
};

// Permission Groups CRUD
export const createPermissionGroup = async (
  data: UserPermissionGroupsInsert
) => {
  const result = await getDb()
    .insert(userPermissionGroups)
    .values(data)
    .returning();
  return result[0];
};

export const getPermissionGroup = async (groupId: string) => {
  const group = await getDb()
    .select()
    .from(userPermissionGroups)
    .where(eq(userPermissionGroups.id, groupId));
  return group[0];
};

export const getPermissionGroupsByOrganisation = async (orgId: string) => {
  return await getDb()
    .select()
    .from(userPermissionGroups)
    .where(eq(userPermissionGroups.organisationId, orgId));
};

export const updatePermissionGroup = async (
  groupId: string,
  data: Partial<UserPermissionGroupsSelect>
) => {
  const result = await getDb()
    .update(userPermissionGroups)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(userPermissionGroups.id, groupId))
    .returning();
  return result[0];
};

export const deletePermissionGroup = async (groupId: string) => {
  await getDb()
    .delete(userPermissionGroups)
    .where(eq(userPermissionGroups.id, groupId));
};

// Path Permissions CRUD
export const createPathPermission = async (data: PathPermissionsInsert) => {
  const result = await getDb().insert(pathPermissions).values(data).returning();
  return result[0];
};

export const getPathPermission = async (permissionId: string) => {
  const permission = await getDb()
    .select()
    .from(pathPermissions)
    .where(eq(pathPermissions.id, permissionId));
  return permission[0];
};

export const updatePathPermission = async (
  permissionId: string,
  data: Partial<PathPermissionsSelect>
) => {
  const result = await getDb()
    .update(pathPermissions)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(pathPermissions.id, permissionId))
    .returning();
  return result[0];
};

export const deletePathPermission = async (permissionId: string) => {
  await getDb()
    .delete(pathPermissions)
    .where(eq(pathPermissions.id, permissionId));
};

// Permission Group Assignment
export const assignPermissionToGroup = async (
  groupId: string,
  permissionId: string
) => {
  const result = await getDb()
    .insert(groupPermissions)
    .values({
      groupId,
      permissionId,
    })
    .returning();
  return result[0];
};

export const removePermissionFromGroup = async (
  groupId: string,
  permissionId: string
) => {
  await getDb()
    .delete(groupPermissions)
    .where(
      and(
        eq(groupPermissions.groupId, groupId),
        eq(groupPermissions.permissionId, permissionId)
      )
    );
};
