import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_MODEL_1,
  TEST_MODEL_2,
} from "../../../../test/init.test";
import { syncModels } from "./index";
import { getDb } from "../../../db/db-connection";
import { aiProviderModels } from "../../../db/db-schema";
import { eq } from "drizzle-orm";

beforeAll(async () => {  
  await initTests();
});

describe("syncModels", () => {
  test("should sync models successfully", async () => {
    // First, let's verify we have some existing models
    const initialModels = await getDb()
      .select()
      .from(aiProviderModels)
      .where(eq(aiProviderModels.organisationId, TEST_ORGANISATION_1.id));

    expect(initialModels.length).toBeGreaterThan(0);

    // Run the sync
    const result = await syncModels(TEST_ORGANISATION_1.id);

    // Verify the result structure
    expect(result).toHaveProperty("added");
    expect(result).toHaveProperty("removed");
    expect(typeof result.added).toBe("number");
    expect(typeof result.removed).toBe("number");

    // Get models after sync
    const modelsAfterSync = await getDb()
      .select()
      .from(aiProviderModels)
      .where(eq(aiProviderModels.organisationId, TEST_ORGANISATION_1.id));

    // Verify that system models are present
    const systemModels = modelsAfterSync.filter((model) => model.system);
    expect(systemModels.length).toBeGreaterThan(0);

    // Verify that our test models are still present
    const testModel1Exists = modelsAfterSync.some(
      (model) => model.name === TEST_MODEL_1.name
    );
    const testModel2Exists = modelsAfterSync.some(
      (model) => model.name === TEST_MODEL_2.name
    );
    expect(testModel1Exists).toBe(true);
    expect(testModel2Exists).toBe(true);
  });

  test("should handle API errors gracefully", async () => {
    // Temporarily modify the fetch URL to cause an error
    const originalFetch = global.fetch;
    global.fetch = async () => {
      throw new Error("API Error");
    };

    try {
      await syncModels(TEST_ORGANISATION_1.id);
      // Should not reach here
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toContain("Failed to sync AI provider models");
    } finally {
      // Restore original fetch
      global.fetch = originalFetch;
    }
  });

  test("should handle empty public models response", async () => {
    // Temporarily modify the fetch to return empty response
    const originalFetch = global.fetch;
    global.fetch = async () => {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    try {
      await syncModels(TEST_ORGANISATION_1.id);
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toContain("Failed to sync AI provider models");
    } finally {
      // Restore original fetch
      global.fetch = originalFetch;
    }
  });
});
