import { getDb } from "../../db/db-connection";
import { knowledgeFilters } from "../../db/db-schema";

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
