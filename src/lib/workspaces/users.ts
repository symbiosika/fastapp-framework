import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../db/db-connection";
import {
  workspaceUsers,
  type WorkspaceUsersInsert,
} from "../db/schema/workspaces";
import { hasAccessToWorkspace } from "./index";

/**
 * Add users to a workspace
 * Only workspace owner can add users
 */
export const addUsersToWorkspace = async (
  workspaceId: string,
  userIds: string[],
  requestingUserId: string
) => {
  // Check if requesting user has owner access
  const hasAccess = await hasAccessToWorkspace(workspaceId, requestingUserId);
  if (!hasAccess) {
    throw new Error("Only workspace owner can add users");
  }

  // Create workspace user entries
  const workspaceUserEntries: WorkspaceUsersInsert[] = userIds.map(
    (userId) => ({
      workspaceId,
      userId,
    })
  );

  // Insert all entries
  await getDb()
    .insert(workspaceUsers)
    .values(workspaceUserEntries)
    // Ignore duplicates
    .onConflictDoNothing();

  return await getDb().query.workspaceUsers.findMany({
    where: and(
      eq(workspaceUsers.workspaceId, workspaceId),
      inArray(workspaceUsers.userId, userIds)
    ),
    with: {
      user: true,
    },
  });
};

/**
 * Remove users from a workspace
 * Only workspace owner can remove users
 */
export const removeUsersFromWorkspace = async (
  workspaceId: string,
  userIds: string[],
  requestingUserId: string
) => {
  // Check if requesting user has owner access
  const hasAccess = await hasAccessToWorkspace(workspaceId, requestingUserId);
  if (!hasAccess) {
    throw new Error("Only workspace owner can remove users");
  }

  // Delete workspace user entries
  await getDb()
    .delete(workspaceUsers)
    .where(
      and(
        eq(workspaceUsers.workspaceId, workspaceId),
        inArray(workspaceUsers.userId, userIds)
      )
    );
};

/**
 * Get all users in a workspace
 * Must be workspace owner or member to view users
 */
export const getWorkspaceUsers = async (
  workspaceId: string,
  requestingUserId: string
) => {
  // Check if requesting user has access (either as owner or member)
  const hasAccess = await hasAccessToWorkspace(workspaceId, requestingUserId);
  const isMember = await getDb().query.workspaceUsers.findFirst({
    where: and(
      eq(workspaceUsers.workspaceId, workspaceId),
      eq(workspaceUsers.userId, requestingUserId)
    ),
  });

  if (!hasAccess && !isMember) {
    throw new Error("Must be workspace owner or member to view users");
  }

  return await getDb().query.workspaceUsers.findMany({
    where: eq(workspaceUsers.workspaceId, workspaceId),
    with: {
      user: true,
    },
  });
};
