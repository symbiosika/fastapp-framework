import { and, eq, inArray, ne, notInArray } from "drizzle-orm";
import { getDb } from "../db/db-connection";
import {
  workspaceUsers,
  type WorkspaceUsersInsert,
} from "../db/schema/workspaces";
import {
  hasAccessToWorkspace,
  isWorkspaceOwner,
  hasOtherMembers,
} from "./index";
import { users } from "../db/schema/users";
import { workspaces } from "../db/schema/workspaces";

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

  // check if the userIds to drop are set as userId in the workspace
  // and after dropping the workspace would have no other members
  const isOwner = await isWorkspaceOwner(workspaceId, requestingUserId);
  const hasOthers = await hasOtherMembers(workspaceId, userIds);
  console.log("isOwner", isOwner);
  console.log("hasOthers", hasOthers);
  if (!isOwner && !hasOthers) {
    throw new Error("Cannot remove all members from a workspace");
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

  // if the userId to drop was set as userId in the workspace, set it to null
  await getDb()
    .update(workspaces)
    .set({ userId: null })
    .where(
      and(eq(workspaces.id, workspaceId), inArray(workspaces.userId, userIds))
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

  return await getDb()
    .select({
      userId: workspaceUsers.userId,
      userEmail: users.email,
    })
    .from(workspaceUsers)
    .leftJoin(users, eq(workspaceUsers.userId, users.id))
    .where(eq(workspaceUsers.workspaceId, workspaceId));
};

/**
 * Get all workspaces shared with a user (where they are a member but not the owner)
 */
export const getSharedWorkspaces = async (userId: string) => {
  const db = getDb();

  // First get all workspaces where the user is a member
  const sharedWorkspaces = await db
    .select({
      workspace: workspaces,
    })
    .from(workspaceUsers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceUsers.workspaceId))
    .where(
      and(
        // User is a member
        eq(workspaceUsers.userId, userId),
        // User is not the owner
        ne(workspaces.userId, userId)
      )
    );

  // Map to return only the workspace objects
  return sharedWorkspaces.map((result) => result.workspace);
};
