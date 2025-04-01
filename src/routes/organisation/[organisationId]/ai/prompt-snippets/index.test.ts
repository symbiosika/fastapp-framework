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
let createdSnippetId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
});

describe("Prompt Templates API Endpoints", () => {
  test("Create a prompt snippet", async () => {
    const snippetData = {
      name: "test-snippet",
      content: "This is a test snippet for reuse in prompts.",
      category: "test",
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`,
      TEST_USER_1_TOKEN,
      snippetData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.name).toBe(snippetData.name);
    expect(response.jsonResponse.content).toBe(snippetData.content);

    // Save the snippet ID for later tests
    createdSnippetId = response.jsonResponse.id;
  });

  test("Get prompt snippets", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(response.jsonResponse.length).toBeGreaterThan(0);
  });

  test("Get prompt snippets by category", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets?category=test`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(response.jsonResponse.length).toBeGreaterThan(0);
    expect(response.jsonResponse[0].category).toBe("test");
  });

  test("Get a prompt snippet by ID", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets/${createdSnippetId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.id).toBe(createdSnippetId);
    expect(response.jsonResponse.name).toBe("test-snippet");
  });

  test("Update a prompt snippet", async () => {
    const updatedSnippet = {
      name: "test-snippet",
      content: "This is an updated test snippet for reuse in prompts.",
      category: "test",
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets/${createdSnippetId}`,
      TEST_USER_1_TOKEN,
      updatedSnippet
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.content).toBe(updatedSnippet.content);
  });

  test("Delete a prompt snippet", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets/${createdSnippetId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });
});
