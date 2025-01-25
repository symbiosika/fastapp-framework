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
 * Add a team member to a team
 */
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

/**
 * Remove a team member from a team
 */
export const removeTeamMember = async (teamId: string, userId: string) => {
  await getDb()
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
};
