import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineRoutes from ".";
import { initTests, TEST_ORGANISATION_1 } from "../../../../../test/init.test";
import { Hono } from "hono";
import type { FastAppHonoContextVariables } from "../../../../../types";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../../../lib/db/db-connection";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
});

describe("Prompt Templates API Edge Cases", () => {
  test("Create prompt snippet with empty content", async () => {
    const snippetData = {
      name: "empty-content-snippet",
      content: "",
      category: "edge-test",
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`,
      TEST_USER_1_TOKEN,
      snippetData
    );

    // Empty content should be rejected by validation
    expect(response.status).toBe(400);
  });

  test("Create prompt snippet with very long content", async () => {
    // Create a very long content (100,000 characters)
    const longContent = "a".repeat(100000);

    const snippetData = {
      name: "long-content-snippet",
      content: longContent,
      category: "edge-test",
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`,
      TEST_USER_1_TOKEN,
      snippetData
    );

    // The API should handle long content appropriately
    // This might succeed or fail depending on the API limits
    expect(response.status).toBe(400);
  });

  test("Create prompt snippet with duplicate name and category", async () => {
    // First, create a snippet
    const snippetData = {
      name: "duplicate-snippet",
      content: "This is a test snippet.",
      category: "edge-test",
      organisationId: TEST_ORGANISATION_1.id,
    };

    await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`,
      TEST_USER_1_TOKEN,
      snippetData
    );

    // Now try to create another with the same name and category
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`,
      TEST_USER_1_TOKEN,
      snippetData
    );

    // Duplicate name and category should be rejected
    expect(response.status).toBe(400);
    expect(response.textResponse).toContain("unique");
  });
});
