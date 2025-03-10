import { describe, it, expect, beforeAll } from "bun:test";
import { getDb } from "../../db/db-connection";
import { upsertFilter } from "./knowledge-filters";
import { knowledgeFilters } from "../../db/schema/knowledge";
import { eq, and } from "drizzle-orm";
import { initTests, TEST_ORGANISATION_1 } from "../../../test/init.test";

describe("upsertFilter", () => {
  beforeAll(async () => {
    await initTests();
  });

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
