import { describe, it, expect, beforeAll } from "bun:test";
import { getDb } from "../../db/db-connection";
import {
  upsertFilter,
  updateFilterName,
  updateFilterCategory,
  getFiltersByCategory,
  deleteFilter,
} from "./knowledge-filters";
import { knowledgeFilters } from "../../db/schema/knowledge";
import { eq, and } from "drizzle-orm";
import { initTests, TEST_ORGANISATION_1 } from "../../../test/init.test";

beforeAll(async () => {
  await initTests();
});

describe("upsertFilter", () => {
  it("should create a new filter if it doesn't exist", async () => {
    const filterId = await upsertFilter(
      "test-category",
      "test-name",
      TEST_ORGANISATION_1.id
    );

    // Verify the filter was created
    const db = getDb();
    const filter = await db
      .select()
      .from(knowledgeFilters)
      .where(
        and(
          eq(knowledgeFilters.category, "test-category"),
          eq(knowledgeFilters.name, "test-name")
        )
      );

    expect(filter.length).toBe(1);
    expect(filter[0].id).toBe(filterId);
    expect(filter[0].category).toBe("test-category");
    expect(filter[0].name).toBe("test-name");
  });

  it("should return existing filter ID if filter already exists", async () => {
    // First insertion
    const firstId = await upsertFilter(
      "test-category",
      "test-name",
      TEST_ORGANISATION_1.id
    );

    // Second insertion with same values
    const secondId = await upsertFilter(
      "test-category",
      "test-name",
      TEST_ORGANISATION_1.id
    );

    // Verify both IDs are the same
    expect(firstId).toBe(secondId);

    // Verify only one record exists
    const db = getDb();
    const filters = await db
      .select()
      .from(knowledgeFilters)
      .where(
        and(
          eq(knowledgeFilters.category, "test-category"),
          eq(knowledgeFilters.name, "test-name")
        )
      );

    expect(filters.length).toBe(1);
  });
});

describe("updateFilterName", () => {
  it("should update a filter's name while keeping its category", async () => {
    // First create a filter
    await upsertFilter("test-category", "old-name", TEST_ORGANISATION_1.id);

    // Update the name
    await updateFilterName(
      "test-category",
      "old-name",
      "new-name",
      TEST_ORGANISATION_1.id
    );

    // Verify the update
    const db = getDb();
    const filter = await db
      .select()
      .from(knowledgeFilters)
      .where(
        and(
          eq(knowledgeFilters.category, "test-category"),
          eq(knowledgeFilters.name, "new-name")
        )
      );

    expect(filter.length).toBe(1);
    expect(filter[0].category).toBe("test-category");
    expect(filter[0].name).toBe("new-name");
  });

  it("should not update if filter doesn't exist", async () => {
    // Try to update a non-existent filter
    await updateFilterName(
      "non-existent-category",
      "non-existent-name",
      "new-name",
      TEST_ORGANISATION_1.id
    );

    // Verify no filter was created
    const db = getDb();
    const filter = await db
      .select()
      .from(knowledgeFilters)
      .where(
        and(
          eq(knowledgeFilters.category, "non-existent-category"),
          eq(knowledgeFilters.name, "new-name")
        )
      );

    expect(filter.length).toBe(0);
  });
});

describe("updateFilterCategory", () => {
  it("should update all filters of a specific category", async () => {
    // Create multiple filters with the same category
    await upsertFilter("old-category", "filter1", TEST_ORGANISATION_1.id);
    await upsertFilter("old-category", "filter2", TEST_ORGANISATION_1.id);

    // Update the category
    await updateFilterCategory(
      "old-category",
      "new-category",
      TEST_ORGANISATION_1.id
    );

    // Verify the updates
    const db = getDb();
    const filters = await db
      .select()
      .from(knowledgeFilters)
      .where(eq(knowledgeFilters.category, "new-category"));

    expect(filters.length).toBe(2);
    expect(filters.map((f) => f.name).sort()).toEqual(["filter1", "filter2"]);
  });

  it("should not update filters from other categories", async () => {
    // Create filters with different categories
    await upsertFilter("category1", "test-filter1", TEST_ORGANISATION_1.id);
    await upsertFilter("category2", "test-filter2", TEST_ORGANISATION_1.id);

    // Update only category1
    await updateFilterCategory(
      "category1",
      "updated-category",
      TEST_ORGANISATION_1.id
    );

    // Verify only category1 was updated
    const db = getDb();
    const updatedFilters = await db
      .select()
      .from(knowledgeFilters)
      .where(eq(knowledgeFilters.category, "updated-category"));

    const unchangedFilters = await db
      .select()
      .from(knowledgeFilters)
      .where(eq(knowledgeFilters.category, "category2"));

    expect(updatedFilters.length).toBe(1);
    expect(unchangedFilters.length).toBe(1);
    expect(unchangedFilters[0].name).toBe("test-filter2");
  });
});

describe("getFiltersByCategory", () => {
  it("should return filters grouped by category", async () => {
    // Create some test filters
    await upsertFilter("category1", "filter1", TEST_ORGANISATION_1.id);
    await upsertFilter("category1", "filter2", TEST_ORGANISATION_1.id);
    await upsertFilter("category2", "filter3", TEST_ORGANISATION_1.id);

    const groupedFilters = await getFiltersByCategory(TEST_ORGANISATION_1.id);

    expect(groupedFilters?.category1.length).toBeGreaterThanOrEqual(2);
    expect(groupedFilters?.category1[0].name).toBe("filter1");
    expect(groupedFilters?.category1[1].name).toBe("filter2");
    expect(groupedFilters?.category2.length).toBeGreaterThanOrEqual(1);
    expect(groupedFilters?.category2[0].name).toBe("filter3");
  });

  it("should return empty object if no filters exist", async () => {
    const groupedFilters = await getFiltersByCategory(
      "99000000-0000-0000-0000-000000000000"
    );
    expect(groupedFilters).toEqual({});
  });
});

describe("deleteFilter", () => {
  it("should delete a filter", async () => {
    // First create a filter
    await upsertFilter("test-category", "test-name", TEST_ORGANISATION_1.id);

    // Delete the filter
    await deleteFilter("test-category", "test-name", TEST_ORGANISATION_1.id);

    // Verify the filter was deleted
    const db = getDb();
    const filter = await db
      .select()
      .from(knowledgeFilters)
      .where(
        and(
          eq(knowledgeFilters.category, "test-category"),
          eq(knowledgeFilters.name, "test-name")
        )
      );

    expect(filter.length).toBe(0);
  });

  it("should not delete non-existent filter", async () => {
    // Try to delete a non-existent filter
    await deleteFilter(
      "non-existent-category",
      "non-existent-name",
      TEST_ORGANISATION_1.id
    );

    // Verify no filters were affected
    const db = getDb();
    const filters = await db
      .select()
      .from(knowledgeFilters)
      .where(eq(knowledgeFilters.organisationId, TEST_ORGANISATION_1.id));

    expect(filters.length).toBeGreaterThan(0);
  });
});
