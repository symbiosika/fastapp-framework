import { getDb } from "../../db/db-connection";
import { knowledgeFilters, knowledgeEntryFilters } from "../../db/db-schema";
import { eq, and } from "drizzle-orm";

/**
 * Upsert a filter and return its ID
 */
export const upsertFilter = async (
  category: string,
  name: string,
  organisationId: string
): Promise<string> => {
  const [newFilter] = await getDb()
    .insert(knowledgeFilters)
    .values({ name, category, organisationId })
    .onConflictDoUpdate({
      target: [knowledgeFilters.name, knowledgeFilters.category],
      set: {
        name,
        category,
      },
    })
    .returning({ id: knowledgeFilters.id });
  return newFilter.id;
};

/**
 * Update a filter's name while keeping its category
 */
export const updateFilterName = async (
  category: string,
  oldName: string,
  newName: string,
  organisationId: string
): Promise<void> => {
  await getDb()
    .update(knowledgeFilters)
    .set({ name: newName })
    .where(
      and(
        eq(knowledgeFilters.category, category),
        eq(knowledgeFilters.name, oldName),
        eq(knowledgeFilters.organisationId, organisationId)
      )
    );
};

/**
 * Update all filters of a specific category to a new category name
 */
export const updateFilterCategory = async (
  oldCategory: string,
  newCategory: string,
  organisationId: string
): Promise<void> => {
  const db = getDb();

  // First get all filters that need to be updated
  const filtersToUpdate = await db
    .select()
    .from(knowledgeFilters)
    .where(
      and(
        eq(knowledgeFilters.category, oldCategory),
        eq(knowledgeFilters.organisationId, organisationId)
      )
    );

  // Update each filter individually to handle potential unique constraint violations
  for (const filter of filtersToUpdate) {
    await db
      .update(knowledgeFilters)
      .set({ category: newCategory })
      .where(
        and(
          eq(knowledgeFilters.id, filter.id),
          eq(knowledgeFilters.organisationId, organisationId)
        )
      );
  }
};

/**
 * Get all filters grouped by category for an organisation
 */
export const getFiltersByCategory = async (
  organisationId: string
): Promise<Record<string, string[]>> => {
  const db = getDb();
  const filters = await db
    .select()
    .from(knowledgeFilters)
    .where(eq(knowledgeFilters.organisationId, organisationId))
    .orderBy(knowledgeFilters.category, knowledgeFilters.name);

  // Group filters by category
  const groupedFilters: Record<string, string[]> = {};
  for (const filter of filters) {
    if (!groupedFilters[filter.category]) {
      groupedFilters[filter.category] = [];
    }
    groupedFilters[filter.category].push(filter.name);
  }

  return groupedFilters;
};

/**
 * Delete a filter by its category and name
 */
export const deleteFilter = async (
  category: string,
  name: string,
  organisationId: string
): Promise<void> => {
  await getDb()
    .delete(knowledgeFilters)
    .where(
      and(
        eq(knowledgeFilters.category, category),
        eq(knowledgeFilters.name, name),
        eq(knowledgeFilters.organisationId, organisationId)
      )
    );
};

/**
 * Add a filter to a knowledge entry
 * This function adds or updates a filter for a specific knowledge entry
 */
export const addFilterToKnowledgeEntry = async (
  knowledgeEntryId: string,
  filterId: string,
  organisationId: string
): Promise<void> => {
  const db = getDb();

  // Verify the filter exists and belongs to the organisation
  const filter = await db
    .select()
    .from(knowledgeFilters)
    .where(
      and(
        eq(knowledgeFilters.id, filterId),
        eq(knowledgeFilters.organisationId, organisationId)
      )
    )
    .limit(1);

  if (!filter || filter.length === 0) {
    throw new Error("Filter not found or does not belong to the organisation");
  }

  // Add the filter to the knowledge entry using Drizzle ORM
  await db
    .insert(knowledgeEntryFilters)
    .values({
      knowledgeEntryId,
      knowledgeFilterId: filterId,
    })
    .onConflictDoNothing({
      target: [
        knowledgeEntryFilters.knowledgeEntryId,
        knowledgeEntryFilters.knowledgeFilterId,
      ],
    });
};

/**
 * Remove a filter from a knowledge entry
 */
export const removeFilterFromKnowledgeEntry = async (
  knowledgeEntryId: string,
  filterId: string,
  organisationId: string
): Promise<void> => {
  const db = getDb();

  // Remove the filter from the knowledge entry using Drizzle ORM
  await db
    .delete(knowledgeEntryFilters)
    .where(eq(knowledgeEntryFilters.id, filterId));
};

/**
 * Get all filters associated with a knowledge entry
 */
export const getFiltersForKnowledgeEntry = async (
  knowledgeEntryId: string
): Promise<any[]> => {
  const db = getDb();

  // Get all filters associated with the knowledge entry using Drizzle ORM
  const filters = await db
    .select({
      filter: knowledgeFilters,
      assigned: knowledgeEntryFilters,
    })
    .from(knowledgeEntryFilters)
    .innerJoin(
      knowledgeFilters,
      eq(knowledgeEntryFilters.knowledgeFilterId, knowledgeFilters.id)
    )
    .where(eq(knowledgeEntryFilters.knowledgeEntryId, knowledgeEntryId));

  return filters.map((result) => ({
    ...result.filter,
    relationId: result.assigned.id,
  }));
};

/**
 * Get a filter by its category and name
 */
export const getFilterByCategoryAndName = async (
  category: string,
  name: string,
  organisationId: string
): Promise<any> => {
  const db = getDb();
  const filter = await db
    .select()
    .from(knowledgeFilters)
    .where(
      and(
        eq(knowledgeFilters.category, category),
        eq(knowledgeFilters.name, name),
        eq(knowledgeFilters.organisationId, organisationId)
      )
    )
    .limit(1);

  return filter[0];
};
