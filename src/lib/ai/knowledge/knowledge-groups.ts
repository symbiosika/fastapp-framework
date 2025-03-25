import { getDb } from "../../db/db-connection";
import {
  knowledgeGroup,
  knowledgeGroupTeamAssignments,
  type KnowledgeGroupInsert,
  type KnowledgeGroupSelect,
} from "../../db/schema/knowledge";
import { and, eq, inArray, or, SQL } from "drizzle-orm";
import { isUserPartOfTeam } from "../../usermanagement/teams";

/**
 * Create a new knowledge group
 */
export const createKnowledgeGroup = async (
  data: KnowledgeGroupInsert
): Promise<KnowledgeGroupSelect> => {
  const db = getDb();

  const [newGroup] = await db.insert(knowledgeGroup).values(data).returning();

  return newGroup;
};

/**
 * Get knowledge groups by organisation ID with optional filtering
 */
export const getKnowledgeGroups = async (params: {
  organisationId: string;
  userId?: string;
  teamId?: string;
  includeTeamAssignments?: boolean;
}): Promise<KnowledgeGroupSelect[]> => {
  const db = getDb();

  const conditions = [eq(knowledgeGroup.organisationId, params.organisationId)];

  // Filter by user if provided
  if (params.userId) {
    conditions.push(
      or(
        eq(knowledgeGroup.userId, params.userId),
        eq(knowledgeGroup.organisationWideAccess, true)
      ) as SQL<unknown>
    );
  }

  // If team ID is provided, filter by team assignments
  if (params.teamId) {
    const teamGroupIds = db
      .select({ id: knowledgeGroupTeamAssignments.knowledgeGroupId })
      .from(knowledgeGroupTeamAssignments)
      .where(eq(knowledgeGroupTeamAssignments.teamId, params.teamId));

    conditions.push(
      or(
        eq(knowledgeGroup.organisationWideAccess, true),
        inArray(knowledgeGroup.id, teamGroupIds)
      ) as SQL<unknown>
    );
  }

  // Basic query without team assignments
  if (!params.includeTeamAssignments) {
    return db
      .select()
      .from(knowledgeGroup)
      .where(and(...conditions))
      .orderBy(knowledgeGroup.name);
  }

  // Advanced query with team assignments
  const groups = await db.query.knowledgeGroup.findMany({
    where: and(...conditions),
    with: {
      teamAssignments: {
        columns: {
          id: true,
          teamId: true,
        },
      },
    },
    orderBy: [knowledgeGroup.name],
  });

  return groups;
};

/**
 * Get a single knowledge group by ID
 */
export const getKnowledgeGroupById = async (
  id: string,
  params: {
    organisationId: string;
    userId?: string;
    includeTeamAssignments?: boolean;
  }
): Promise<KnowledgeGroupSelect | null> => {
  const db = getDb();

  const conditions = [
    eq(knowledgeGroup.id, id),
    eq(knowledgeGroup.organisationId, params.organisationId),
  ];

  // Add user check if specified
  if (params.userId) {
    conditions.push(
      or(
        eq(knowledgeGroup.userId, params.userId),
        eq(knowledgeGroup.organisationWideAccess, true)
      ) as SQL<unknown>
    );
  }

  if (!params.includeTeamAssignments) {
    const group = await db
      .select()
      .from(knowledgeGroup)
      .where(and(...conditions))
      .limit(1);

    return group[0] || null;
  }

  const group = await db.query.knowledgeGroup.findFirst({
    where: and(...conditions),
    with: {
      teamAssignments: {
        columns: {
          id: true,
          teamId: true,
        },
      },
    },
  });

  return group || null;
};

/**
 * Update a knowledge group
 */
export const updateKnowledgeGroup = async (
  id: string,
  data: Partial<KnowledgeGroupInsert>,
  params: {
    organisationId: string;
    userId: string;
  }
): Promise<KnowledgeGroupSelect> => {
  const db = getDb();

  // Check if user has permission to update this group
  const group = await getKnowledgeGroupById(id, {
    organisationId: params.organisationId,
    userId: params.userId,
  });

  if (!group) {
    throw new Error(
      "Knowledge group not found or user does not have permission to update it"
    );
  }

  // Update the group
  const [updatedGroup] = await db
    .update(knowledgeGroup)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(knowledgeGroup.id, id),
        eq(knowledgeGroup.organisationId, params.organisationId)
      )
    )
    .returning();

  return updatedGroup;
};

/**
 * Delete a knowledge group
 */
export const deleteKnowledgeGroup = async (
  id: string,
  params: {
    organisationId: string;
    userId: string;
  }
): Promise<void> => {
  const db = getDb();

  // Check if user has permission to delete this group
  const group = await getKnowledgeGroupById(id, {
    organisationId: params.organisationId,
    userId: params.userId,
  });

  if (!group) {
    throw new Error(
      "Knowledge group not found or user does not have permission to delete it"
    );
  }

  // Delete the group
  await db
    .delete(knowledgeGroup)
    .where(
      and(
        eq(knowledgeGroup.id, id),
        eq(knowledgeGroup.organisationId, params.organisationId)
      )
    );
};

/**
 * Assign a team to a knowledge group
 */
export const assignTeamToKnowledgeGroup = async (
  knowledgeGroupId: string,
  teamId: string,
  params: {
    organisationId: string;
    userId: string;
  }
): Promise<void> => {
  const db = getDb();

  // Check if user has permission to update this group
  const group = await getKnowledgeGroupById(knowledgeGroupId, {
    organisationId: params.organisationId,
    userId: params.userId,
  });

  if (!group) {
    throw new Error(
      "Knowledge group not found or user does not have permission to update it"
    );
  }

  // Check if user is part of the team
  const isPartOfTeam = await isUserPartOfTeam(params.userId, teamId);
  if (!isPartOfTeam) {
    throw new Error("User is not part of the provided team");
  }

  // Create the assignment
  await db
    .insert(knowledgeGroupTeamAssignments)
    .values({
      knowledgeGroupId,
      teamId,
    })
    .onConflictDoNothing({
      target: [
        knowledgeGroupTeamAssignments.knowledgeGroupId,
        knowledgeGroupTeamAssignments.teamId,
      ],
    });
};

/**
 * Remove a team from a knowledge group
 */
export const removeTeamFromKnowledgeGroup = async (
  knowledgeGroupId: string,
  teamId: string,
  params: {
    organisationId: string;
    userId: string;
  }
): Promise<void> => {
  const db = getDb();

  // Check if user has permission to update this group
  const group = await getKnowledgeGroupById(knowledgeGroupId, {
    organisationId: params.organisationId,
    userId: params.userId,
  });

  if (!group) {
    throw new Error(
      "Knowledge group not found or user does not have permission to update it"
    );
  }

  // Delete the assignment
  await db
    .delete(knowledgeGroupTeamAssignments)
    .where(
      and(
        eq(knowledgeGroupTeamAssignments.knowledgeGroupId, knowledgeGroupId),
        eq(knowledgeGroupTeamAssignments.teamId, teamId)
      )
    );
};

/**
 * Get all teams assigned to a knowledge group
 */
export const getTeamsForKnowledgeGroup = async (
  knowledgeGroupId: string,
  params: {
    organisationId: string;
    userId: string;
  }
): Promise<string[]> => {
  const db = getDb();

  // Check if user has permission to view this group
  const group = await getKnowledgeGroupById(knowledgeGroupId, {
    organisationId: params.organisationId,
    userId: params.userId,
  });

  if (!group) {
    throw new Error(
      "Knowledge group not found or user does not have permission to view it"
    );
  }

  // Get all team assignments for this group
  const assignments = await db
    .select({ teamId: knowledgeGroupTeamAssignments.teamId })
    .from(knowledgeGroupTeamAssignments)
    .where(
      eq(knowledgeGroupTeamAssignments.knowledgeGroupId, knowledgeGroupId)
    );

  return assignments.map((a) => a.teamId);
};
