import { getDb } from "../../../lib/db/db-connection";
import { and, eq, inArray, or, isNull } from "drizzle-orm";
import {
  knowledgeEntry,
  knowledgeGroup,
  knowledgeGroupTeamAssignments,
} from "../../db/schema/knowledge";
import { workspaces } from "../../db/schema/workspaces";
import { teamMembers } from "../../db/schema/users";

/**
 * Helper function to get all team IDs a user is a member of
 */
export const getUserTeamIds = async (
  userId: string,
  organisationId: string
): Promise<string[]> => {
  const userTeams = await getDb().query.teamMembers.findMany({
    where: eq(teamMembers.userId, userId),
    columns: {
      teamId: true,
    },
    with: {
      team: true,
    },
  });
  // Filter the teams by organisationId after fetching
  return userTeams
    .filter((t) => t.team.organisationId === organisationId)
    .map((t) => t.teamId);
};

/**
 * Helper function to get all workspace IDs a user has access to
 * This includes:
 * - Workspaces directly assigned to the user
 * - Workspaces assigned to teams the user is a member of
 */
export const getUserWorkspaceIds = async (
  userId: string,
  organisationId: string,
  teamIds?: string[]
): Promise<string[]> => {
  // Get all teams the user is a member of
  if (!teamIds) {
    teamIds = await getUserTeamIds(userId, organisationId);
  }
  // Get workspaces where:
  // - user is directly assigned OR
  // - workspace is assigned to one of user's teams
  const workspaceEntries = await getDb().query.workspaces.findMany({
    where: or(
      eq(workspaces.userId, userId),
      inArray(workspaces.teamId, teamIds)
    ),
    columns: {
      id: true,
    },
  });
  return workspaceEntries.map((w) => w.id);
};

/**
 * Helper function  to get all knowledge-groups a user has access to
 */
export const getUserKnowledgeGroupIds = async (
  userId: string,
  organisationId: string,
  userTeams?: string[]
): Promise<string[]> => {
  const db = getDb();

  // Get all teams the user is a member of
  if (!userTeams) {
    userTeams = await getUserTeamIds(userId, organisationId);
  }

  // Get knowledge groups where:
  // 1. The user is the direct owner, OR
  // 2. The group has organisation-wide access, OR
  // 3. The group is assigned to one of the user's teams

  // Get directly owned and org-wide groups
  const directGroups = await db.query.knowledgeGroup.findMany({
    where: or(
      eq(knowledgeGroup.userId, userId),
      eq(knowledgeGroup.organisationWideAccess, true)
    ),
    columns: {
      id: true,
    },
  });

  // Get team-assigned groups if user has any teams
  let teamGroups: { id: string }[] = [];
  if (userTeams.length > 0) {
    const teamAssignments =
      await db.query.knowledgeGroupTeamAssignments.findMany({
        where: inArray(knowledgeGroupTeamAssignments.teamId, userTeams),
        columns: {
          knowledgeGroupId: true,
        },
      });

    if (teamAssignments.length > 0) {
      const teamGroupIds = teamAssignments.map((t) => t.knowledgeGroupId);
      teamGroups = await db.query.knowledgeGroup.findMany({
        where: inArray(knowledgeGroup.id, teamGroupIds),
        columns: {
          id: true,
        },
      });
    }
  }

  // Combine and deduplicate the results
  const allGroups = [...directGroups, ...teamGroups];
  const uniqueGroupIds = [...new Set(allGroups.map((g) => g.id))];

  return uniqueGroupIds;
};

/**
 * Helper to validate if a user can access a knowledge entry
 * will take the knowledge id and the userid
 */
export const validateKnowledgeAccess = async (
  knowledgeId: string,
  userId: string,
  organisationId: string
) => {
  const userTeams = await getUserTeamIds(userId, organisationId);
  const usersWorkspaces = await getUserWorkspaceIds(
    userId,
    organisationId,
    userTeams
  );

  // First check: user has direct access to the knowledge entry
  const directAccess = await getDb().query.knowledgeEntry.findFirst({
    where: and(
      eq(knowledgeEntry.id, knowledgeId),
      or(
        eq(knowledgeEntry.userId, userId),
        // Include NULL teamId and entries with user's teams
        or(
          isNull(knowledgeEntry.teamId),
          inArray(knowledgeEntry.teamId, userTeams)
        ),
        // Include NULL workspaceId and entries with user's workspaces
        or(
          isNull(knowledgeEntry.workspaceId),
          inArray(knowledgeEntry.workspaceId, usersWorkspaces)
        )
      )
    ),
  });

  if (directAccess) {
    return true;
  }

  // Second check: access through knowledge group assignments
  // First get the entry with its knowledge group
  const entryWithGroup = await getDb().query.knowledgeEntry.findFirst({
    where: eq(knowledgeEntry.id, knowledgeId),
    columns: {
      id: true,
      knowledgeGroupId: true,
    },
  });

  if (!entryWithGroup?.knowledgeGroupId) {
    return false; // No knowledge group assigned
  }

  // Check if the knowledge group is organisation-wide accessible
  const groupWithOrgWideAccess = await getDb().query.knowledgeGroup.findFirst({
    where: and(
      eq(knowledgeGroup.id, entryWithGroup.knowledgeGroupId),
      eq(knowledgeGroup.organisationWideAccess, true)
    ),
  });

  if (groupWithOrgWideAccess) {
    return true; // Organisation-wide access granted
  }

  // Check if any of user's teams are assigned to the knowledge group
  const teamAssignment =
    await getDb().query.knowledgeGroupTeamAssignments.findFirst({
      where: and(
        eq(
          knowledgeGroupTeamAssignments.knowledgeGroupId,
          entryWithGroup.knowledgeGroupId
        ),
        inArray(knowledgeGroupTeamAssignments.teamId, userTeams)
      ),
    });

  return !!teamAssignment; // Access granted if team assignment exists
};
