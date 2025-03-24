import { getDb } from "../../db/db-connection";
import { knowledgeFilters } from "../../db/db-schema";
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
