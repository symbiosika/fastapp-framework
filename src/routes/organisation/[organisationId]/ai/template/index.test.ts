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

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let createdTemplateId: string;
let createdPlaceholderId: string;
let createdSnippetId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
});

describe("Prompt Templates API Endpoints", () => {
  test("Get all templates", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
  });

  test("Create a new prompt template", async () => {
    const templateData = {
      name: "test-template",
      label: "Test Template",
      description: "A test template for unit testing",
      category: "test",
      systemPrompt: "You are a helpful assistant for testing.",
      userPrompt: "Please respond to: {{query}}",
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`,
      TEST_USER_1_TOKEN,
      templateData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.name).toBe(templateData.name);
    expect(response.jsonResponse.systemPrompt).toBe(templateData.systemPrompt);
    expect(response.jsonResponse.id).toBeDefined();

    // Save the ID for later tests
    createdTemplateId = response.jsonResponse.id;
  });

  test("Get a template by ID", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates?id=${createdTemplateId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.id).toBe(createdTemplateId);
  });

  test("Get a template by name and category", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates?name=test-template&category=test`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.name).toBe("test-template");
    expect(response.jsonResponse.category).toBe("test");
  });

  test("Update a prompt template", async () => {
    const updatedData = {
      id: createdTemplateId,
      name: "test-template",
      label: "Updated Test Template",
      description: "An updated test template",
      category: "test",
      systemPrompt: "You are an updated helpful assistant for testing.",
      userPrompt: "Please respond to: {{query}}",
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}`,
      TEST_USER_1_TOKEN,
      updatedData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.label).toBe(updatedData.label);
    expect(response.jsonResponse.systemPrompt).toBe(updatedData.systemPrompt);
  });

  test("Add a placeholder to a template", async () => {
    const placeholderData = {
      name: "query",
      label: "Query",
      description: "The user's query",
      type: "text",
      requiredByUser: true,
      defaultValue: "What can you help me with?",
      promptTemplateId: createdTemplateId,
      suggestions: ["Are you there?", "What is your name?"],
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders`,
      TEST_USER_1_TOKEN,
      placeholderData
    );

    expect(response.status).toBe(200);

    // Save the placeholder ID for later tests
    createdPlaceholderId = response.jsonResponse.id;

    // check the response
    expect(response.jsonResponse.name).toBe(placeholderData.name);
    expect(response.jsonResponse.promptTemplateId).toBe(createdTemplateId);
    expect(response.jsonResponse.suggestions).toBeDefined();
    expect(Array.isArray(response.jsonResponse.suggestions)).toBe(true);
    expect(response.jsonResponse.suggestions).toEqual(
      placeholderData.suggestions
    );
  });

  test("Get placeholders for a template", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(response.jsonResponse.length).toBeGreaterThan(0);
    expect(response.jsonResponse[0].name).toBe("query");
  });

  test("Get a placeholder by ID", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders/${createdPlaceholderId}`,
      TEST_USER_1_TOKEN
    );

    console.log(response.textResponse);
    expect(response.status).toBe(200);
    expect(response.jsonResponse.id).toBe(createdPlaceholderId);
    expect(response.jsonResponse.name).toBe("query");
  });

  test("Update a placeholder", async () => {
    const updatedPlaceholder = {
      id: createdPlaceholderId,
      name: "query",
      label: "Updated Query",
      description: "The updated user's query",
      type: "text",
      requiredByUser: true,
      defaultValue: "What would you like to know?",
      promptTemplateId: createdTemplateId,
      suggestions: ["How does this work?", "Tell me more about this"],
      hidden: false,
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders/${createdPlaceholderId}`,
      TEST_USER_1_TOKEN,
      updatedPlaceholder
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.label).toBe(updatedPlaceholder.label);
    expect(response.jsonResponse.defaultValue).toBe(
      updatedPlaceholder.defaultValue
    );
    expect(response.jsonResponse.suggestions).toBeDefined();
    expect(Array.isArray(response.jsonResponse.suggestions)).toBe(true);
    expect(response.jsonResponse.suggestions).toEqual(
      updatedPlaceholder.suggestions
    );
  });

  test("Get placeholders with default values", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/placeholders?promptId=${createdTemplateId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.placeholders).toBeDefined();
    expect(response.jsonResponse.placeholderDefinitions).toBeDefined();
    expect(response.jsonResponse.placeholders.query).toBeDefined();
  });

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

  // Cleanup tests - run these last
  test("Delete a placeholder", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders/${createdPlaceholderId}`,
      TEST_USER_1_TOKEN
    );

    console.log(response.textResponse);
    expect(response.status).toBe(200);
  });

  test("Delete a prompt snippet", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets/${createdSnippetId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });

  test("Delete a prompt template", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });
});
