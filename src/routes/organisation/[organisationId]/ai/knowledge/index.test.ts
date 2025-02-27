import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineRoutes from ".";
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
import { readFileSync } from "fs";
import { join } from "path";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let createdKnowledgeTextId: string;
let createdKnowledgeEntryId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
});

describe("Knowledge API Endpoints", () => {
  test("Create a knowledge text entry", async () => {
    const textData = {
      organisationId: TEST_ORGANISATION_1.id,
      text: "This is a test knowledge text for unit testing.",
      title: "Test Knowledge Text",
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

    // Save the ID for later tests
    createdKnowledgeTextId = response.jsonResponse.id;
  });

  test("Get knowledge text entries", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/texts`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(response.jsonResponse.length).toBeGreaterThan(0);
    expect(
      response.jsonResponse.some(
        (entry: any) => entry.id === createdKnowledgeTextId
      )
    ).toBe(true);
  });

  test("Update a knowledge text entry", async () => {
    const updatedData = {
      organisationId: TEST_ORGANISATION_1.id,
      text: "This is an updated test knowledge text.",
      title: "Updated Test Knowledge Text",
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/texts/${createdKnowledgeTextId}`,
      TEST_USER_1_TOKEN,
      updatedData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.text).toBe(updatedData.text);
    expect(response.jsonResponse.title).toBe(updatedData.title);
  });

  test("Parse document to create knowledge entry", async () => {
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

    // Save the ID for later tests
    createdKnowledgeEntryId = response.jsonResponse.id;
  });

  test("Get knowledge entries", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/entries`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(response.jsonResponse.length).toBeGreaterThan(0);
  });

  test("Get a knowledge entry by ID", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/entries/${createdKnowledgeEntryId}`,
      TEST_USER_1_TOKEN
    );

    console.log(response.textResponse);
    expect(response.status).toBe(200);
    expect(response.jsonResponse.entry.id).toBe(createdKnowledgeEntryId);
  });

  test("Extract knowledge from existing DB entry", async () => {
    const extractData = {
      organisationId: TEST_ORGANISATION_1.id,
      sourceType: "text",
      sourceId: createdKnowledgeTextId,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/extract-knowledge`,
      TEST_USER_1_TOKEN,
      extractData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.ok).toBe(true);
    expect(response.jsonResponse.id).toBeDefined();
  });

  test("Add knowledge from text", async () => {
    const textData = {
      organisationId: TEST_ORGANISATION_1.id,
      text: "This is another test knowledge text added directly.",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/from-text`,
      TEST_USER_1_TOKEN,
      textData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.text).toBe(textData.text);
    expect(response.jsonResponse.id).toBeDefined();
  });

  test("Add knowledge from URL", async () => {
    const urlData = {
      organisationId: TEST_ORGANISATION_1.id,
      url: "https://example.com",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/from-url`,
      TEST_USER_1_TOKEN,
      urlData
    );

    // This might fail in CI environments without internet access
    // So we're just checking that the endpoint responds
    expect([200, 400]).toContain(response.status);
  });

  test("Perform similarity search", async () => {
    const searchData = {
      organisationId: TEST_ORGANISATION_1.id,
      searchText: "test knowledge",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/similarity-search`,
      TEST_USER_1_TOKEN,
      searchData
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
  });

  test("Upload and learn from PDF file", async () => {
    const filePath = join(
      process.cwd(),
      "src/fastapp-framework/src/test/files/example_knowlede.pdf"
    );
    const fileBuffer = readFileSync(filePath);
    const file = new File([fileBuffer], "example_knowlede.pdf", {
      type: "application/pdf",
    });

    const formData = new FormData();
    formData.append("file", file);

    const response = await testFetcher.postFormData(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/upload-and-learn`,
      TEST_USER_1_TOKEN,
      formData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.ok).toBe(true);
    expect(response.jsonResponse.id).toBeDefined();
  }, 120000);

  // Cleanup tests - run these last
  test("Delete a knowledge entry", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/entries/${createdKnowledgeEntryId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });

  test("Delete a knowledge text entry", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge/texts/${createdKnowledgeTextId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });
});
