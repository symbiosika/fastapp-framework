import { getDb } from "../../../lib/db/db-connection";
import { and, eq, inArray, SQL, sql, or, isNull, exists } from "drizzle-orm";
import {
  type KnowledgeChunkMeta,
  knowledgeChunks,
  knowledgeEntry,
  knowledgeEntryFilters,
  knowledgeFilters,
  type KnowledgeEntrySelect,
  knowledgeGroup,
  knowledgeGroupTeamAssignments,
  type KnowledgeChunksSelect,
} from "../../db/schema/knowledge";
import log from "../../../lib/log";
import {
  getUserKnowledgeGroupIds,
  getUserTeamIds,
  getUserWorkspaceIds,
  validateKnowledgeAccess,
} from "./permissions";
import { getFilterIdsFromNames } from "./knowledge-filters";

type PlainKnowledgetEntry = {
  text: string;
  knowledgeEntryId: string;
  knowledgeEntryName: string;
  chunkId: string;
  meta: KnowledgeChunkMeta;
};

type KnowledgeWithChunks = KnowledgeEntrySelect & {
  chunks: KnowledgeChunksSelect[];
  fullText: string;
};

/**
 * Get the full knowledge entry with all chunks.
 * This is used for RAG prompting to get knowledge as plain text.
 */
export const extendKnowledgeEntriesWithTextChunks = async (
  entries: KnowledgeEntrySelect[]
): Promise<KnowledgeWithChunks[]> => {
  const entriesWithChunks: KnowledgeWithChunks[] = [];

  for (const entry of entries) {
    const chunks = await getDb().query.knowledgeChunks.findMany({
      where: eq(knowledgeChunks.knowledgeEntryId, entry.id),
      orderBy: (knowledgeChunks, { asc }) => [asc(knowledgeChunks.order)],
    });
    entriesWithChunks.push({
      ...entry,
      chunks,
      fullText: chunks.map((chunk) => chunk.text).join("\n"),
    });
  }
  return entriesWithChunks;
};

/**
 * Get filtered knowledgebase entries from DB for a user WITH PAGINATION
 * without the chunks/texts. only the list of knowledge entries
 */
export const getKnowledgeEntries = async (query: {
  // Context
  organisationId: string;
  userId: string;
  // Pagination
  limit?: number; // default: 100
  page?: number; // default: 0
  // Filters. At least one filter must be provided.
  teamId?: string;
  workspaceId?: string;
  knowledgeGroupId?: string;
  userOwned?: boolean;
  ids?: string[];
  filterIds?: string[];
  filterNames?: {
    [category: string]: string[];
  };
}): Promise<
  (KnowledgeEntrySelect & {
    filters: {
      id: string;
      filter: {
        id: string;
        category: string;
        name: string;
      };
    }[];
  })[]
> => {
  // 1.) convert filterNames to filterIds if set
  if (query.filterNames) {
    const filterIds = await getFilterIdsFromNames(query.filterNames);
    query.filterIds = filterIds;
  }

  // 2.) Get all access conditions
  const userTeams = await getUserTeamIds(query.userId, query.organisationId);
  const usersWorkspaces = await getUserWorkspaceIds(
    query.userId,
    query.organisationId,
    userTeams
  );
  const userKnowledgeGroupIds = await getUserKnowledgeGroupIds(
    query.userId,
    query.organisationId,
    userTeams
  );

  // 3.) fist fast validation: check if the filters teamId, workspaceId, knowledgeGroupId
  // are part of the known userTeams, usersWorkspaces, userKnowledgeGroupIds
  if (query.teamId && !userTeams.includes(query.teamId)) {
    throw new Error(`User does not have access to team ${query.teamId}`);
  }
  if (query.workspaceId && !usersWorkspaces.includes(query.workspaceId)) {
    throw new Error(
      `User does not have access to workspace ${query.workspaceId}`
    );
  }
  if (
    query.knowledgeGroupId &&
    !userKnowledgeGroupIds.includes(query.knowledgeGroupId)
  ) {
    throw new Error(
      `User does not have access to knowledge group ${query.knowledgeGroupId}`
    );
  }

  // 4.) Add optional filters if provided
  // always add the organisationId filter
  const filterConditions: (SQL<unknown> | undefined)[] = [
    eq(knowledgeEntry.organisationId, query.organisationId),
  ];
  // check for team
  if (query.teamId) {
    filterConditions.push(eq(knowledgeEntry.teamId, query.teamId));
  } else {
    filterConditions.push(
      or(
        isNull(knowledgeEntry.teamId),
        inArray(knowledgeEntry.teamId, userTeams)
      )
    );
  }
  // check for workspace
  if (query.workspaceId) {
    filterConditions.push(eq(knowledgeEntry.workspaceId, query.workspaceId));
  } else {
    filterConditions.push(isNull(knowledgeEntry.workspaceId));
  }
  // check for knowledge group
  if (query.knowledgeGroupId) {
    filterConditions.push(
      eq(knowledgeEntry.knowledgeGroupId, query.knowledgeGroupId)
    );
  } else {
    filterConditions.push(
      or(
        isNull(knowledgeEntry.knowledgeGroupId),
        inArray(knowledgeEntry.knowledgeGroupId, userKnowledgeGroupIds)
      )
    );
  }
  // check for knowledge IDs
  if (query.ids?.length) {
    filterConditions.push(inArray(knowledgeEntry.id, query.ids));
  }
  // check for user owned
  if (query.userOwned === true) {
    filterConditions.push(
      and(
        eq(knowledgeEntry.userOwned, true),
        eq(knowledgeEntry.userId, query.userId)
      )
    );
  } else if (query.userOwned === false) {
    filterConditions.push(eq(knowledgeEntry.userOwned, false));
  }
  // check for filter IDs - add this new condition
  if (query.filterIds) {
    // Subquery to get knowledgeEntry IDs that have at least one of the specified filterIds
    const subQuery = getDb()
      .selectDistinct({ id: knowledgeEntryFilters.knowledgeEntryId }) // Select distinct entry IDs
      .from(knowledgeEntryFilters)
      .where(
        // Filter the knowledgeEntryFilters table by the provided filter IDs
        inArray(knowledgeEntryFilters.knowledgeFilterId, query.filterIds)
      );
    // Add condition to the main query: knowledgeEntry.id must be in the result of the subquery
    filterConditions.push(inArray(knowledgeEntry.id, subQuery));
  }

  // 5.) Get the knowledge entries
  const entriesQuery = getDb().query.knowledgeEntry.findMany({
    limit: query?.limit ?? 100,
    offset: query?.page ? query.page * (query.limit ?? 100) : undefined,
    where: and(...filterConditions),
    orderBy: (entry, { desc }) => [desc(entry.createdAt)], // Use 'entry' alias provided by findMany/orderBy context
    // with filters and knowledge group
    with: {
      filters: {
        columns: {
          id: true,
        },
        with: {
          filter: {
            columns: {
              id: true,
              category: true,
              name: true,
            },
          },
        },
      },
      knowledgeGroup: true,
    },
  });

  const sql = entriesQuery.toSQL();
  try {
    return await entriesQuery; // Execute the query
  } catch (error) {
    log.error("Error executing SQL:", sql.sql, "Params:", sql.params);
    log.error("Original Error:", error + ""); // Log the original error for more details
    throw error;
  }
};

/**
 * Get the full plain source text/documents for a knowledge entry id
 * Is used in the UI to display the full source text/documents for a knowledge entry
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
    with: {
      filters: {
        columns: {
          id: true,
        },
        with: {
          filter: {
            columns: {
              id: true,
              category: true,
              name: true,
            },
          },
        },
      },
      knowledgeGroup: true,
    },
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
