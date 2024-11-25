import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  createDatabaseClient,
  getDb,
  waitForDbConnection,
} from "../../db/db-connection";
import { upsertFilter } from "./knowledge-filters";
import { knowledgeFilters } from "../../db/schema/knowledge";
import { eq, and } from "drizzle-orm";

describe("upsertFilter", () => {
  beforeAll(async () => {
    await createDatabaseClient();
    await waitForDbConnection();
  });

  afterAll(async () => {
    // Clean up test data after each test
    const db = getDb();
    await db
      .delete(knowledgeFilters)
      .where(
        and(
          eq(knowledgeFilters.category, "test-category"),
          eq(knowledgeFilters.name, "test-name")
        )
      );
  });

  it("should create a new filter if it doesn't exist", async () => {
    const filterId = await upsertFilter("test-category", "test-name");

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
    const firstId = await upsertFilter("test-category", "test-name");

    // Second insertion with same values
    const secondId = await upsertFilter("test-category", "test-name");

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
