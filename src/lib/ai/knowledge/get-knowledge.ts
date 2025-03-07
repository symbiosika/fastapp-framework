import { getDb } from "../../../lib/db/db-connection";
import { and, eq, inArray, SQL, sql, or, isNull } from "drizzle-orm";
import {
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

type KnowledgeQuery = {
  id?: string[];
  names?: string[];
  chunkCount?: number;
  chunkOffset?: number;
  filters?: Record<string, string[]>;
  userId: string;
  teamId?: string;
  workspaceId?: string;
  organisationId: string;
};

type KnowledgeEntryWithChunks = typeof knowledgeEntry.$inferSelect & {
  knowledgeChunks: (typeof knowledgeChunks.$inferSelect)[];
};

type PlainKnowledgetEntry = {
  text: string;
  knowledgeEntryId: string;
  chunkId: string;
};

/**
 * Helper function to get a knowledge entry with its chunks
 */
const getKnowledgeWithChunks = async (
  id: string,
  chunkOffset?: number,
  chunkCount?: number
) => {
  const e = await getDb().query.knowledgeEntry.findMany({
    where: eq(knowledgeEntry.id, id),
  });
  const chunks = await getDb().query.knowledgeChunks.findMany({
    where: eq(knowledgeChunks.knowledgeEntryId, id),
    orderBy: (knowledgeChunks, { asc }) => [asc(knowledgeChunks.order)],
    offset: chunkOffset,
    limit: chunkCount,
  });
  return { ...e[0], knowledgeChunks: chunks };
};

/**
 * Helper function to get a knowledge entry with its chunks
 * with conditions
 */
const getKnowledgeWithChunksWithConditions = async (
  where: SQL<unknown> | undefined
) => {
  const entries = await getDb().query.knowledgeEntry.findMany({
    where,
  });

  const entriesWithChunks = await Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      knowledgeChunks: await getDb().query.knowledgeChunks.findMany({
        where: eq(knowledgeChunks.knowledgeEntryId, entry.id),
        orderBy: (knowledgeChunks, { asc }) => [asc(knowledgeChunks.order)],
      }),
    }))
  );

  return entriesWithChunks;
};

/**
 * Helper to validate if a user can access a knowledge entry
 * will take the knowledge id and the userid
 */
const validateKnowledgeAccess = async (
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
 * Helper function to get all team IDs a user is a member of
 */
const getUserTeamIds = async (
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
const getUserWorkspaceIds = async (
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
 * Helper to get knowledge by an id, name(s) or filters from DB
 * Will return the knowledge as an array with the original IDs.
 */
const getKnowledge = async (
  query: KnowledgeQuery
): Promise<KnowledgeEntryWithChunks[]> => {
  const userTeams = await getUserTeamIds(query.userId, query.organisationId);
  const usersWorkspaces = await getUserWorkspaceIds(
    query.userId,
    query.organisationId,
    userTeams
  );

  // Updated access conditions to include NULL values
  const accessConditions = [
    eq(knowledgeEntry.userId, query.userId),
    or(
      isNull(knowledgeEntry.teamId),
      inArray(knowledgeEntry.teamId, userTeams)
    ),
    or(
      isNull(knowledgeEntry.workspaceId),
      inArray(knowledgeEntry.workspaceId, usersWorkspaces)
    ),
  ];

  // Query based on direct ID(s)
  if (query.id) {
    const entries = await Promise.all(
      query.id.map(async (id) => {
        const hasAccess = await validateKnowledgeAccess(
          id,
          query.userId,
          query.organisationId
        );
        if (!hasAccess) {
          throw new Error(
            `User does not have permission to access knowledge entry ${id}`
          );
        }
        return getKnowledgeWithChunks(id, query.chunkOffset, query.chunkCount);
      })
    );
    return entries;
  }

  // Query based on names or categories from fine-tuning data
  const conditions = [or(...accessConditions)]; // Add access control as first condition

  if (query.names?.length) {
    conditions.push(inArray(knowledgeEntry.name, query.names));
  }

  if (query.filters) {
    await log.debug(
      `Getting knowledge filtered by: ${JSON.stringify(query.filters)}`
    );

    for (const [category, values] of Object.entries(query.filters)) {
      if (values.length) {
        const subquery = getDb()
          .select({ id: knowledgeEntryFilters.knowledgeEntryId })
          .from(knowledgeEntryFilters)
          .innerJoin(
            knowledgeFilters,
            eq(knowledgeFilters.id, knowledgeEntryFilters.knowledgeFilterId)
          )
          .where(
            and(
              eq(knowledgeFilters.category, category),
              inArray(knowledgeFilters.name, values)
            )
          );

        conditions.push(sql`${knowledgeEntry.id} IN (${subquery})`);
      }
    }
  }

  if (conditions.length === 1) {
    // Only access conditions present
    await log.debug(
      "No conditions to filter knowledge base are provided. At least one filter must be provided."
    );
    throw new Error(
      "No conditions to filter knowledge base are provided. At least one filter must be provided."
    );
  }

  const where = and(...conditions);

  const entriesWithChunks = await getKnowledgeWithChunksWithConditions(where);
  await log.debug(`Return ${entriesWithChunks.length} knowledge entries`);
  return entriesWithChunks;
};

/**
 * Get the full knowledge entry with all chunks.
 * This is used for RAG prompting to get knowledge as plain text.
 */
export const getPlainKnowledge = async (
  query: KnowledgeQuery
): Promise<PlainKnowledgetEntry[]> => {
  const knowledge = await getKnowledge(query);
  const plainKnowledge: PlainKnowledgetEntry[] = [];
  for (const entry of knowledge) {
    for (const chunk of entry.knowledgeChunks) {
      plainKnowledge.push({
        text: chunk.text,
        knowledgeEntryId: entry.id,
        chunkId: chunk.id,
      });
    }
  }
  return plainKnowledge;
};

/**
 * Get all (filtered) knowledgebase entries from DB for a user
 * with pagination
 * without the chunks/texts. only the list of knowledge entries
 */
export const getKnowledgeEntries = async (query: {
  limit?: number;
  page?: number;
  organisationId: string;
  userId: string;
  teamId?: string;
  workspaceId?: string;
  ids?: string[];
}): Promise<
  (KnowledgeEntrySelect & {
    filters: {
      id: string;
      filter: {
        category: string;
        name: string;
      };
    }[];
  })[]
> => {
  const userTeams = await getUserTeamIds(query.userId, query.organisationId);
  const usersWorkspaces = await getUserWorkspaceIds(
    query.userId,
    query.organisationId,
    userTeams
  );

  // Updated access conditions to include NULL values
  const accessConditions = [
    eq(knowledgeEntry.userId, query.userId),
    or(
      isNull(knowledgeEntry.teamId),
      inArray(knowledgeEntry.teamId, userTeams)
    ),
    or(
      isNull(knowledgeEntry.workspaceId),
      inArray(knowledgeEntry.workspaceId, usersWorkspaces)
    ),
  ];

  // Add optional filters if provided
  const filterConditions = [];
  if (query.teamId) {
    filterConditions.push(eq(knowledgeEntry.teamId, query.teamId));
  }
  if (query.workspaceId) {
    filterConditions.push(eq(knowledgeEntry.workspaceId, query.workspaceId));
  }
  if (query.ids?.length) {
    filterConditions.push(inArray(knowledgeEntry.id, query.ids));
  }
  if (!query.workspaceId) {
    filterConditions.push(isNull(knowledgeEntry.workspaceId));
  }

  const r = await getDb().query.knowledgeEntry.findMany({
    limit: query?.limit ?? 100,
    offset: query?.page ? query.page * (query.limit ?? 100) : undefined,
    where: and(
      eq(knowledgeEntry.organisationId, query.organisationId),
      or(...accessConditions),
      ...filterConditions
    ),
    orderBy: (knowledgeEntry, { desc }) => [desc(knowledgeEntry.createdAt)],
    with: {
      filters: {
        columns: {
          id: true,
        },
        with: {
          filter: {
            columns: {
              category: true,
              name: true,
            },
          },
        },
      },
    },
  });
  // filter the teams by organisationId
  return r;
};

/**
 * Delete a knowledge entry by ID
 * will check if the user has permission to delete the knowledge entry
 */
export const deleteKnowledgeEntry = async (
  id: string,
  organisationId: string,
  userId: string,
  deleteSource = false
) => {
  // check the user permissions
  const canDelete = await validateKnowledgeAccess(id, userId, organisationId);
  if (!canDelete) {
    throw new Error(
      "User does not have permission to delete this knowledge entry"
    );
  }

  // also delete the source if requested
  if (deleteSource) {
    const e = await getDb().query.knowledgeEntry.findFirst({
      where: and(
        eq(knowledgeEntry.id, id),
        eq(knowledgeEntry.organisationId, organisationId)
      ),
    });
    if (e?.sourceType === "db" && e.sourceId && e.sourceFileBucket) {
      await deleteFileFromDB(e.sourceId, e.sourceFileBucket, organisationId);
    } else if (e?.sourceType === "local" && e.sourceId && e.sourceFileBucket) {
      await deleteFileFromLocalDisc(
        e.sourceId,
        e.sourceFileBucket,
        organisationId
      );
    } else if (e?.sourceType === "text" && e.sourceId) {
      await getDb()
        .delete(knowledgeText)
        .where(eq(knowledgeText.id, e.sourceId));
    }
  }
  await getDb().delete(knowledgeEntry).where(eq(knowledgeEntry.id, id));
};

/**
 * Update a knowledge entry by ID
 * Only the name can be updated
 */
export const updateKnowledgeEntry = async (
  id: string,
  organisationId: string,
  userId: string,
  data: {
    name: string;
  }
) => {
  const canUpdate = await validateKnowledgeAccess(id, userId, organisationId);
  if (!canUpdate) {
    throw new Error(
      "User does not have permission to update this knowledge entry"
    );
  }
  const r = await getDb()
    .update(knowledgeEntry)
    .set(data)
    .where(eq(knowledgeEntry.id, id))
    .returning();

  return r[0];
};

/**
 * Get the full plain source text/documents for a knowledge entry id
 */
export const getFullSourceDocumentsForKnowledgeEntry = async (
  id: string,
  organisationId: string,
  userId: string
) => {
  // Check user permissions first
  const hasAccess = await validateKnowledgeAccess(id, userId, organisationId);
  if (!hasAccess) {
    throw new Error(
      "User does not have permission to access this knowledge entry"
    );
  }

  const entry = await getDb().query.knowledgeEntry.findFirst({
    where: and(
      eq(knowledgeEntry.id, id),
      eq(knowledgeEntry.organisationId, organisationId)
    ),
  });
  const chunks = await getDb().query.knowledgeChunks.findMany({
    where: eq(knowledgeChunks.knowledgeEntryId, id),
    orderBy: (knowledgeChunks, { asc }) => [asc(knowledgeChunks.order)],
  });
  const text = chunks.map((chunk) => chunk.text).join("\n");
  return {
    entry,
    text,
  };
};
