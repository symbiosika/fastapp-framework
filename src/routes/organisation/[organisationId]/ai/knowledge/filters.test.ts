import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineKnowledgeRoutes from ".";
import defineKnowledgeFilterRoutes from "../knowledge-filters";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_USER_1,
} from "../../../../../test/init.test";
import { Hono } from "hono";
import type { FastAppHonoContextVariables } from "../../../../../types";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../../../lib/db/db-connection";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let createdKnowledgeTextId: string;
let createdKnowledgeEntryId: string;
let createdFilterId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineKnowledgeRoutes(app, "/api");
  defineKnowledgeFilterRoutes(app, "/api");
  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
});

describe("Knowledge Filter Management API Endpoints", () => {
  test("Create a knowledge text entry for testing", async () => {
    const textData = {
      organisationId: TEST_ORGANISATION_1.id,
      text: "This is a test knowledge text for filter testing.",
      title: "Test Knowledge Text for Filters",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/texts`,
      TEST_USER_1_TOKEN,
      textData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.text).toBe(textData.text);
    expect(response.jsonResponse.title).toBe(textData.title);
    expect(response.jsonResponse.id).toBeDefined();

    createdKnowledgeTextId = response.jsonResponse.id;
  });

  test("Parse document to create knowledge entry for testing", async () => {
    const parseData = {
      sourceType: "text",
      sourceId: createdKnowledgeTextId,
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/extract-knowledge`,
      TEST_USER_1_TOKEN,
      parseData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.id).toBeDefined();

    createdKnowledgeEntryId = response.jsonResponse.id;
  });

  test("Create a knowledge filter for testing", async () => {
    const filterData = {
      organisationId: TEST_ORGANISATION_1.id,
      category: "test-category",
      name: "test-filter",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      TEST_USER_1_TOKEN,
      filterData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.id).toBeDefined();
    createdFilterId = response.jsonResponse.id;
  });

  test("Add a filter to a knowledge entry", async () => {
    const filterData = {
      filterId: createdFilterId,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/entries/${createdKnowledgeEntryId}/filters`,
      TEST_USER_1_TOKEN,
      filterData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toEqual({ success: true });
  });

  test("Get all filters for a knowledge entry", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/entries/${createdKnowledgeEntryId}/filters`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(response.jsonResponse.length).toBeGreaterThan(0);
    expect(response.jsonResponse[0].id).toBe(createdFilterId);
    expect(response.jsonResponse[0].category).toBe("test-category");
    expect(response.jsonResponse[0].name).toBe("test-filter");
  });

  test("Remove a filter from a knowledge entry", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/entries/${createdKnowledgeEntryId}/filters/${createdFilterId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toEqual({ success: true });

    // Verify the filter was removed
    const getResponse = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/entries/${createdKnowledgeEntryId}/filters`,
      TEST_USER_1_TOKEN
    );

    expect(getResponse.status).toBe(200);
    expect(getResponse.jsonResponse.length).toBe(0);
  });

  // Cleanup tests
  test("Delete the test knowledge entry", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/entries/${createdKnowledgeEntryId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });

  test("Delete the test knowledge text entry", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/texts/${createdKnowledgeTextId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });

  test("Delete the test filter", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters?category=test-category&name=test-filter`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });
}); 