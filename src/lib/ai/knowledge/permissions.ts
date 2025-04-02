import { getDb } from "../../../lib/db/db-connection";
import { and, eq, inArray, SQL, sql, or, isNull } from "drizzle-orm";
import {
  type KnowledgeChunkMeta,
  knowledgeChunks,
  knowledgeEntry,
  knowledgeEntryFilters,
  knowledgeFilters,
  knowledgeText,
  type KnowledgeEntrySelect,
} from "../../db/schema/knowledge";
import log from "../../../lib/log";
import { deleteFileFromDB } from "../../storage/db";
import { deleteFileFromLocalDisc } from "../../storage/local";
import { workspaces } from "../../db/schema/workspaces";
import { teamMembers } from "../../db/schema/users";
import { isUserPartOfTeam } from "../../usermanagement/teams";

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

  const knowledge = await getDb().query.knowledgeEntry.findFirst({
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

  return !!knowledge;
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
