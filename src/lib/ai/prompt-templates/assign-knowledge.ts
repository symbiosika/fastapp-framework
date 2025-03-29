import { and, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/db-connection";
import {
  promptTemplateKnowledgeEntries,
  promptTemplateKnowledgeFilters,
  promptTemplateKnowledgeGroups,
  promptTemplates,
} from "../../../lib/db/schema/prompts";
import {
  knowledgeEntry,
  knowledgeFilters,
  knowledgeGroup,
} from "../../../lib/db/schema/knowledge";

/**
 * Assign knowledge entries to a prompt template
 * This will replace all existing assignments
 */
export const assignKnowledgeEntriesToPromptTemplate = async (
  promptTemplateId: string,
  knowledgeEntryIds: string[]
) => {
  const db = getDb();

  // Verify prompt template exists
  const template = await db
    .select()
    .from(promptTemplates)
    .where(eq(promptTemplates.id, promptTemplateId));

  if (template.length === 0) {
    throw new Error("Prompt template not found");
  }

  // Verify all knowledge entries exist
  if (knowledgeEntryIds.length > 0) {
    const entries = await db
      .select()
      .from(knowledgeEntry)
      .where(eq(knowledgeEntry.id, knowledgeEntryIds[0])); // Just check first one for now

    if (entries.length === 0) {
      throw new Error("Knowledge entry not found");
    }
  }

  // Delete existing assignments
  await db
    .delete(promptTemplateKnowledgeEntries)
    .where(
      eq(promptTemplateKnowledgeEntries.promptTemplateId, promptTemplateId)
    );

  // Add new assignments if any
  if (knowledgeEntryIds.length > 0) {
    await db.insert(promptTemplateKnowledgeEntries).values(
      knowledgeEntryIds.map((entryId) => ({
        promptTemplateId,
        knowledgeEntryId: entryId,
      }))
    );
  }

  return { success: true };
};

/**
 * Assign knowledge filters to a prompt template
 * This will replace all existing assignments
 */
export const assignKnowledgeFiltersToPromptTemplate = async (
  promptTemplateId: string,
  knowledgeFilterIds: string[]
) => {
  const db = getDb();

  // Verify prompt template exists
  const template = await db
    .select()
    .from(promptTemplates)
    .where(eq(promptTemplates.id, promptTemplateId));

  if (template.length === 0) {
    throw new Error("Prompt template not found");
  }

  // Verify all knowledge filters exist
  if (knowledgeFilterIds.length > 0) {
    const filters = await db
      .select()
      .from(knowledgeFilters)
      .where(eq(knowledgeFilters.id, knowledgeFilterIds[0])); // Just check first one for now

    if (filters.length === 0) {
      throw new Error("Knowledge filter not found");
    }
  }

  // Delete existing assignments
  await db
    .delete(promptTemplateKnowledgeFilters)
    .where(
      eq(promptTemplateKnowledgeFilters.promptTemplateId, promptTemplateId)
    );

  // Add new assignments if any
  if (knowledgeFilterIds.length > 0) {
    await db.insert(promptTemplateKnowledgeFilters).values(
      knowledgeFilterIds.map((filterId) => ({
        promptTemplateId,
        knowledgeFilterId: filterId,
      }))
    );
  }

  return { success: true };
};

/**
 * Assign knowledge groups to a prompt template
 * This will replace all existing assignments
 */
export const assignKnowledgeGroupsToPromptTemplate = async (
  promptTemplateId: string,
  knowledgeGroupIds: string[]
) => {
  const db = getDb();

  // Verify prompt template exists
  const template = await db
    .select()
    .from(promptTemplates)
    .where(eq(promptTemplates.id, promptTemplateId));

  if (template.length === 0) {
    throw new Error("Prompt template not found");
  }

  // Verify all knowledge groups exist
  if (knowledgeGroupIds.length > 0) {
    const groups = await db
      .select()
      .from(knowledgeGroup)
      .where(eq(knowledgeGroup.id, knowledgeGroupIds[0])); // Just check first one for now

    if (groups.length === 0) {
      throw new Error("Knowledge group not found");
    }
  }

  // Delete existing assignments
  await db
    .delete(promptTemplateKnowledgeGroups)
    .where(
      eq(promptTemplateKnowledgeGroups.promptTemplateId, promptTemplateId)
    );

  // Add new assignments if any
  if (knowledgeGroupIds.length > 0) {
    await db.insert(promptTemplateKnowledgeGroups).values(
      knowledgeGroupIds.map((groupId) => ({
        promptTemplateId,
        knowledgeGroupId: groupId,
      }))
    );
  }

  return { success: true };
};

/**
 * Get all knowledge entries assigned to a prompt template
 */
export const getKnowledgeEntriesForPromptTemplate = async (
  promptTemplateId: string
) => {
  const db = getDb();

  const entries = await db
    .select({
      id: knowledgeEntry.id,
      name: knowledgeEntry.name,
      description: knowledgeEntry.description,
    })
    .from(promptTemplateKnowledgeEntries)
    .innerJoin(
      knowledgeEntry,
      eq(knowledgeEntry.id, promptTemplateKnowledgeEntries.knowledgeEntryId)
    )
    .where(
      eq(promptTemplateKnowledgeEntries.promptTemplateId, promptTemplateId)
    );

  return entries;
};

/**
 * Get all knowledge filters assigned to a prompt template
 */
export const getKnowledgeFiltersForPromptTemplate = async (
  promptTemplateId: string
) => {
  const db = getDb();

  const filters = await db
    .select({
      id: knowledgeFilters.id,
      name: knowledgeFilters.name,
      category: knowledgeFilters.category,
    })
    .from(promptTemplateKnowledgeFilters)
    .innerJoin(
      knowledgeFilters,
      eq(knowledgeFilters.id, promptTemplateKnowledgeFilters.knowledgeFilterId)
    )
    .where(
      eq(promptTemplateKnowledgeFilters.promptTemplateId, promptTemplateId)
    );

  return filters;
};

/**
 * Get all knowledge groups assigned to a prompt template
 */
export const getKnowledgeGroupsForPromptTemplate = async (
  promptTemplateId: string
) => {
  const db = getDb();

  const groups = await db
    .select({
      id: knowledgeGroup.id,
      name: knowledgeGroup.name,
      description: knowledgeGroup.description,
    })
    .from(promptTemplateKnowledgeGroups)
    .innerJoin(
      knowledgeGroup,
      eq(knowledgeGroup.id, promptTemplateKnowledgeGroups.knowledgeGroupId)
    )
    .where(
      eq(promptTemplateKnowledgeGroups.promptTemplateId, promptTemplateId)
    );

  return groups;
};
