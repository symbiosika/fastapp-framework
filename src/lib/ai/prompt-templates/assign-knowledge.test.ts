import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from "bun:test";
import {
  assignKnowledgeEntriesToPromptTemplate,
  assignKnowledgeFiltersToPromptTemplate,
  assignKnowledgeGroupsToPromptTemplate,
  getKnowledgeEntriesForPromptTemplate,
  getKnowledgeFiltersForPromptTemplate,
  getKnowledgeGroupsForPromptTemplate,
  deleteKnowledgeEntriesFromPromptTemplate,
  deleteKnowledgeFiltersFromPromptTemplate,
  deleteKnowledgeGroupsFromPromptTemplate,
} from "./assign-knowledge";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_ADMIN_USER,
} from "../../../test/init.test";
import { addPromptTemplate, deletePromptTemplate } from "./crud";
import { getDb } from "../../../lib/db/db-connection";
import {
  knowledgeEntry,
  knowledgeFilters,
  knowledgeGroup,
} from "../../../lib/db/schema/knowledge";
import { eq } from "drizzle-orm";

describe("Prompt Template Knowledge Assignments", () => {
  const testTemplate = {
    organisationId: TEST_ORGANISATION_1.id,
    name: "Test Template",
    category: "test",
    systemPrompt: "Test prompt",
    userPrompt: null,
    langCode: "en",
    needsInitialCall: false,
    llmOptions: {},
    hidden: false,
  };

  let templateId: string;
  let knowledgeEntryId: string;
  let knowledgeFilterId: string;
  let knowledgeGroupId: string;

  // Setup test data
  beforeAll(async () => {
    await initTests();

    // Create test knowledge entry
    const entry = await getDb()
      .insert(knowledgeEntry)
      .values({
        organisationId: TEST_ORGANISATION_1.id,
        name: "Test Knowledge Entry",
        description: "Test description",
        sourceType: "text",
      })
      .returning();
    knowledgeEntryId = entry[0].id;

    // Create test knowledge filter
    const filter = await getDb()
      .insert(knowledgeFilters)
      .values({
        organisationId: TEST_ORGANISATION_1.id,
        category: "test",
        name: "Test Filter",
      })
      .returning();
    knowledgeFilterId = filter[0].id;

    // Create test knowledge group
    const group = await getDb()
      .insert(knowledgeGroup)
      .values({
        organisationId: TEST_ORGANISATION_1.id,
        name: "Test Group",
        description: "Test group description",
        userId: TEST_ADMIN_USER.id,
        organisationWideAccess: false,
      })
      .returning();
    knowledgeGroupId = group[0].id;

    // Create test template
    const template = await addPromptTemplate(testTemplate);
    templateId = template.id;
  });

  describe("Knowledge Entries", () => {
    test("should assign knowledge entries to prompt template", async () => {
      const result = await assignKnowledgeEntriesToPromptTemplate(
        templateId,
        [knowledgeEntryId],
        true
      );
      expect(result.success).toBe(true);

      const entries = await getKnowledgeEntriesForPromptTemplate(templateId);
      expect(entries.length).toBe(1);
      expect(entries[0].id).toBe(knowledgeEntryId);
    });

    test("should update knowledge entries assignment", async () => {
      // Create another knowledge entry
      const newEntry = await getDb()
        .insert(knowledgeEntry)
        .values({
          organisationId: TEST_ORGANISATION_1.id,
          name: "New Knowledge Entry",
          description: "New description",
          sourceType: "text",
        })
        .returning();

      const result = await assignKnowledgeEntriesToPromptTemplate(
        templateId,
        [newEntry[0].id],
        true
      );
      expect(result.success).toBe(true);

      const entries = await getKnowledgeEntriesForPromptTemplate(templateId);
      expect(entries.length).toBe(1);
      expect(entries[0].id).toBe(newEntry[0].id);
    });

    test("should remove all knowledge entries", async () => {
      const result = await assignKnowledgeEntriesToPromptTemplate(
        templateId,
        [],
        true
      );
      expect(result.success).toBe(true);

      const entries = await getKnowledgeEntriesForPromptTemplate(templateId);
      expect(entries.length).toBe(0);
    });
  });

  describe("Knowledge Filters", () => {
    test("should assign knowledge filters to prompt template", async () => {
      const result = await assignKnowledgeFiltersToPromptTemplate(
        templateId,
        [knowledgeFilterId],
        true
      );
      expect(result.success).toBe(true);

      const filters = await getKnowledgeFiltersForPromptTemplate(templateId);
      expect(filters.length).toBe(1);
      expect(filters[0].id).toBe(knowledgeFilterId);
    });

    test("should update knowledge filters assignment", async () => {
      // Create another knowledge filter
      const newFilter = await getDb()
        .insert(knowledgeFilters)
        .values({
          organisationId: TEST_ORGANISATION_1.id,
          category: "test",
          name: "New Filter",
        })
        .returning();

      const result = await assignKnowledgeFiltersToPromptTemplate(
        templateId,
        [newFilter[0].id],
        true
      );
      expect(result.success).toBe(true);

      const filters = await getKnowledgeFiltersForPromptTemplate(templateId);
      expect(filters.length).toBe(1);
      expect(filters[0].id).toBe(newFilter[0].id);
    });

    test("should remove all knowledge filters", async () => {
      const result = await assignKnowledgeFiltersToPromptTemplate(
        templateId,
        [],
        true
      );
      expect(result.success).toBe(true);

      const filters = await getKnowledgeFiltersForPromptTemplate(templateId);
      expect(filters.length).toBe(0);
    });
  });

  describe("Knowledge Groups", () => {
    test("should assign knowledge groups to prompt template", async () => {
      const result = await assignKnowledgeGroupsToPromptTemplate(
        templateId,
        [knowledgeGroupId],
        true
      );
      expect(result.success).toBe(true);

      const groups = await getKnowledgeGroupsForPromptTemplate(templateId);
      expect(groups.length).toBe(1);
      expect(groups[0].id).toBe(knowledgeGroupId);
    });

    test("should update knowledge groups assignment", async () => {
      // Create another knowledge group
      const newGroup = await getDb()
        .insert(knowledgeGroup)
        .values({
          organisationId: TEST_ORGANISATION_1.id,
          name: "New Group",
          description: "New group description",
          userId: TEST_ADMIN_USER.id,
          organisationWideAccess: false,
        })
        .returning();

      const result = await assignKnowledgeGroupsToPromptTemplate(
        templateId,
        [newGroup[0].id],
        true
      );
      expect(result.success).toBe(true);

      const groups = await getKnowledgeGroupsForPromptTemplate(templateId);
      expect(groups.length).toBe(1);
      expect(groups[0].id).toBe(newGroup[0].id);
    });

    test("should remove all knowledge groups", async () => {
      const result = await assignKnowledgeGroupsToPromptTemplate(
        templateId,
        [],
        true
      );
      expect(result.success).toBe(true);

      const groups = await getKnowledgeGroupsForPromptTemplate(templateId);
      expect(groups.length).toBe(0);
    });
  });

  describe("Error Handling", () => {
    test("should throw error for non-existent prompt template", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000999";
      await expect(
        assignKnowledgeEntriesToPromptTemplate(nonExistentId, [], true)
      ).rejects.toThrow("Prompt template not found");
    });

    test("should throw error for non-existent knowledge entry", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000999";
      await expect(
        assignKnowledgeEntriesToPromptTemplate(
          templateId,
          [nonExistentId],
          true
        )
      ).rejects.toThrow("Knowledge entry not found");
    });

    test("should throw error for non-existent knowledge filter", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000999";
      await expect(
        assignKnowledgeFiltersToPromptTemplate(
          templateId,
          [nonExistentId],
          true
        )
      ).rejects.toThrow("Knowledge filter not found");
    });

    test("should throw error for non-existent knowledge group", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000999";
      await expect(
        assignKnowledgeGroupsToPromptTemplate(templateId, [nonExistentId], true)
      ).rejects.toThrow("Knowledge group not found");
    });
  });

  describe("Delete Knowledge Assignments", () => {
    test("should delete specific knowledge entry from prompt template", async () => {
      // First assign an entry
      await assignKnowledgeEntriesToPromptTemplate(
        templateId,
        [knowledgeEntryId],
        true
      );

      // Verify it exists
      let entries = await getKnowledgeEntriesForPromptTemplate(templateId);
      expect(entries.length).toBe(1);

      // Delete the entry
      const result = await deleteKnowledgeEntriesFromPromptTemplate(
        templateId,
        [knowledgeEntryId]
      );
      expect(result.success).toBe(true);

      // Verify it's gone
      entries = await getKnowledgeEntriesForPromptTemplate(templateId);
      expect(entries.length).toBe(0);
    });

    test("should delete all knowledge entries from prompt template", async () => {
      // First assign an entry
      await assignKnowledgeEntriesToPromptTemplate(
        templateId,
        [knowledgeEntryId],
        true
      );

      // Verify it exists
      let entries = await getKnowledgeEntriesForPromptTemplate(templateId);
      expect(entries.length).toBe(1);

      // Delete all entries
      const result = await deleteKnowledgeEntriesFromPromptTemplate(templateId);
      expect(result.success).toBe(true);

      // Verify they're gone
      entries = await getKnowledgeEntriesForPromptTemplate(templateId);
      expect(entries.length).toBe(0);
    });

    test("should delete specific knowledge filter from prompt template", async () => {
      // First assign a filter
      await assignKnowledgeFiltersToPromptTemplate(
        templateId,
        [knowledgeFilterId],
        true
      );

      // Verify it exists
      let filters = await getKnowledgeFiltersForPromptTemplate(templateId);
      expect(filters.length).toBe(1);

      // Delete the filter
      const result = await deleteKnowledgeFiltersFromPromptTemplate(
        templateId,
        [knowledgeFilterId]
      );
      expect(result.success).toBe(true);

      // Verify it's gone
      filters = await getKnowledgeFiltersForPromptTemplate(templateId);
      expect(filters.length).toBe(0);
    });

    test("should delete all knowledge filters from prompt template", async () => {
      // First assign a filter
      await assignKnowledgeFiltersToPromptTemplate(
        templateId,
        [knowledgeFilterId],
        true
      );

      // Verify it exists
      let filters = await getKnowledgeFiltersForPromptTemplate(templateId);
      expect(filters.length).toBe(1);

      // Delete all filters
      const result = await deleteKnowledgeFiltersFromPromptTemplate(templateId);
      expect(result.success).toBe(true);

      // Verify they're gone
      filters = await getKnowledgeFiltersForPromptTemplate(templateId);
      expect(filters.length).toBe(0);
    });

    test("should delete specific knowledge group from prompt template", async () => {
      // First assign a group
      await assignKnowledgeGroupsToPromptTemplate(
        templateId,
        [knowledgeGroupId],
        true
      );

      // Verify it exists
      let groups = await getKnowledgeGroupsForPromptTemplate(templateId);
      expect(groups.length).toBe(1);

      // Delete the group
      const result = await deleteKnowledgeGroupsFromPromptTemplate(templateId, [
        knowledgeGroupId,
      ]);
      expect(result.success).toBe(true);

      // Verify it's gone
      groups = await getKnowledgeGroupsForPromptTemplate(templateId);
      expect(groups.length).toBe(0);
    });

    test("should delete all knowledge groups from prompt template", async () => {
      // First assign a group
      await assignKnowledgeGroupsToPromptTemplate(
        templateId,
        [knowledgeGroupId],
        true
      );

      // Verify it exists
      let groups = await getKnowledgeGroupsForPromptTemplate(templateId);
      expect(groups.length).toBe(1);

      // Delete all groups
      const result = await deleteKnowledgeGroupsFromPromptTemplate(templateId);
      expect(result.success).toBe(true);

      // Verify they're gone
      groups = await getKnowledgeGroupsForPromptTemplate(templateId);
      expect(groups.length).toBe(0);
    });

    test("should throw error when deleting from non-existent prompt template", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000999";
      await expect(
        deleteKnowledgeEntriesFromPromptTemplate(nonExistentId)
      ).rejects.toThrow("Prompt template not found");
      await expect(
        deleteKnowledgeFiltersFromPromptTemplate(nonExistentId)
      ).rejects.toThrow("Prompt template not found");
      await expect(
        deleteKnowledgeGroupsFromPromptTemplate(nonExistentId)
      ).rejects.toThrow("Prompt template not found");
    });
  });

  afterAll(async () => {
    // Clean up test data
    getDb()
      .delete(knowledgeEntry)
      .where(eq(knowledgeEntry.id, knowledgeEntryId));
    getDb()
      .delete(knowledgeFilters)
      .where(eq(knowledgeFilters.id, knowledgeFilterId));
    getDb()
      .delete(knowledgeGroup)
      .where(eq(knowledgeGroup.id, knowledgeGroupId));
  });
});
