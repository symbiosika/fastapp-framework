import { eq, and } from "drizzle-orm";
import { getDb } from "../db/db-connection";
import {
  userPermissionGroups,
  pathPermissions,
  groupPermissions,
  type UserPermissionGroupsSelect,
  type PathPermissionsSelect,
  type UserPermissionGroupsInsert,
  type PathPermissionsInsert,
} from "../db/schema/users";

/**
 * Create a permission group
 * A permission group is a collection of permissions
 * A user can be assigned to multiple permission groups
 */
export const createPermissionGroup = async (
  data: UserPermissionGroupsInsert
) => {
  const result = await getDb()
    .insert(userPermissionGroups)
    .values(data)
    .returning();
  return result[0];
};

/**
 * Get a permission group by its ID
 */
export const getPermissionGroup = async (groupId: string) => {
  const group = await getDb()
    .select()
    .from(userPermissionGroups)
    .where(eq(userPermissionGroups.id, groupId));
  return group[0];
};

/**
 * Get all permission groups by an organisation ID
 */
export const getPermissionGroupsByOrganisation = async (orgId: string) => {
  return await getDb()
    .select()
    .from(userPermissionGroups)
    .where(eq(userPermissionGroups.organisationId, orgId));
};

/**
 * Update a permission group
 */
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

/**
 * Delete a permission group
 */
export const deletePermissionGroup = async (groupId: string) => {
  await getDb()
    .delete(userPermissionGroups)
    .where(eq(userPermissionGroups.id, groupId));
};

/**
 * Create a path permission
 */
export const createPathPermission = async (data: PathPermissionsInsert) => {
  const result = await getDb().insert(pathPermissions).values(data).returning();
  return result[0];
};

/**
 * Get a path permission by its ID
 */
export const getPathPermission = async (permissionId: string) => {
  const permission = await getDb()
    .select()
    .from(pathPermissions)
    .where(eq(pathPermissions.id, permissionId));
  return permission[0];
};

/**
 * Update a path permission
 */
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

/**
 * Delete a path permission
 */
export const deletePathPermission = async (permissionId: string) => {
  await getDb()
    .delete(pathPermissions)
    .where(eq(pathPermissions.id, permissionId));
};

/**
 * Assign a permission to a group
 */
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

/**
 * Remove a permission from a group
 */
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
