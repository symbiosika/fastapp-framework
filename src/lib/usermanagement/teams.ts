/**
 * CRUD operations for teams
 *
 * Teams are used to group users together inside a organisation
 */

import { getDb } from "../db/db-connection";
import { eq, and } from "drizzle-orm";
import {
  teams,
  teamMembers,
  type TeamsSelect,
  type TeamsInsert,
} from "../db/schema/users";

/**
 * Create a team
 */
export const createTeam = async (data: TeamsInsert) => {
  const result = await getDb().insert(teams).values(data).returning();
  return result[0];
};

/**
 * Get a team by its ID
 */
export const getTeam = async (teamId: string) => {
  const team = await getDb().select().from(teams).where(eq(teams.id, teamId));
  return team[0];
};

/**
 * Update a team
 */
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

/**
 * Delete a team
 */
export const deleteTeam = async (teamId: string) => {
  await getDb().delete(teams).where(eq(teams.id, teamId));
};

/**
 * Get all teams by an organisation ID
 */
export const getTeamsByOrganisation = async (orgId: string) => {
  return await getDb()
    .select()
    .from(teams)
    .where(eq(teams.organisationId, orgId));
};

/**
 * Get all team for a specific user
 */
export const getTeamsByUser = async (userId: string, orgId: string) => {
  return await getDb()
    .select()
    .from(teams)
    .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
    .where(
      and(eq(teamMembers.userId, userId), eq(teams.organisationId, orgId))
    );
};

/**
 * Drop the membership of a user from a team
 */
export const dropUserFromTeam = async (userId: string, teamId: string) => {
  await getDb()
    .delete(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)));
};

/**
 * Add a team member to a team
 */
export const addTeamMember = async (
  teamId: string,
  userId: string,
  role?: "admin" | "member"
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

export const checkTeamMemberRole = async (
  teamId: string,
  userId: string,
  roleToCheck: "admin" | "member"
) => {
  const member = await getDb()
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));

  if (member.length === 0 || member[0].role !== roleToCheck) {
    throw new Error("You are not allowed to remove team members");
  }
  return true;
};

/**
 * Remove a team member from a team
 */
export const removeTeamMember = async (
  teamId: string,
  destinationUserId: string
) => {
  // do the actual removal
  await getDb()
    .delete(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, destinationUserId)
      )
    );
};

/**
 * Update the role of a team member
 */
export const updateTeamMemberRole = async (
  teamId: string,
  destinationUserId: string,
  role: "admin" | "member"
) => {
  // do the actual update
  const result = await getDb()
    .update(teamMembers)
    .set({ role })
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, destinationUserId)
      )
    )
    .returning();
  return result[0];
};
