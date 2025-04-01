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
let createdTemplateId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;

  // Create a test template for edge case tests
  const templateData = {
    name: "edge-case-template",
    label: "Edge Case Template",
    description: "A template for edge case testing",
    category: "edge-test",
    systemPrompt: "You are a helpful assistant for edge case testing.",
    userPrompt: "Please respond to: {{query}}",
    organisationId: TEST_ORGANISATION_1.id,
    promptTemplateId: createdTemplateId,
  };

  const response = await testFetcher.post(
    app,
    `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`,
    TEST_USER_1_TOKEN,
    templateData
  );

  createdTemplateId = response.jsonResponse.id;
});

describe("Prompt Templates API Edge Cases", () => {
  test("Create template with empty name", async () => {
    const templateData = {
      name: "",
      label: "Empty Name Template",
      description: "A template with an empty name",
      category: "edge-test",
      systemPrompt: "You are a helpful assistant.",
      userPrompt: "Please respond to: {{query}}",
      organisationId: TEST_ORGANISATION_1.id,
      promptTemplateId: createdTemplateId,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`,
      TEST_USER_1_TOKEN,
      templateData
    );

    // Empty name should be rejected by validation
    expect(response.status).toBe(400);
    expect(response.textResponse).toContain(
      "Name and category must be between 1 and 255 characters."
    );
  });

  test("Create template with very long name", async () => {
    // Create a very long name (1000 characters)
    const longName = "a".repeat(1000);

    const templateData = {
      name: longName,
      label: "Long Name Template",
      description: "A template with a very long name",
      category: "edge-test",
      systemPrompt: "You are a helpful assistant.",
      userPrompt: "Please respond to: {{query}}",
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`,
      TEST_USER_1_TOKEN,
      templateData
    );

    // Very long name should be rejected
    expect(response.status).toBe(400);
  });

  test("Create template with very long system prompt", async () => {
    // Create a very long system prompt (100,000 characters)
    const longPrompt = "a".repeat(100000);

    const templateData = {
      name: "long-prompt-template",
      label: "Long Prompt Template",
      description: "A template with a very long system prompt",
      category: "edge-test",
      systemPrompt: longPrompt,
      userPrompt: "Please respond to: {{query}}",
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`,
      TEST_USER_1_TOKEN,
      templateData
    );

    // The API should handle long prompts appropriately
    // This might succeed or fail depending on the API limits
    expect(response.status).toBe(400);
  });

  test("Create template with duplicate name and category", async () => {
    const templateData = {
      name: "edge-case-template", // Same as the one created in beforeAll
      label: "Duplicate Template",
      description: "A template with a duplicate name and category",
      category: "edge-test", // Same as the one created in beforeAll
      systemPrompt: "You are a helpful assistant.",
      userPrompt: "Please respond to: {{query}}",
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`,
      TEST_USER_1_TOKEN,
      templateData
    );

    // Duplicate name and category should be rejected
    expect(response.status).toBe(400);
    expect(response.textResponse).toContain("unique");
  });

  test("Create placeholder with invalid type", async () => {
    const placeholderData = {
      name: "invalid-type",
      label: "Invalid Type",
      description: "A placeholder with an invalid type",
      type: "invalid", // Not 'text' or 'image'
      requiredByUser: true,
      defaultValue: "Default value",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders`,
      TEST_USER_1_TOKEN,
      placeholderData
    );

    // Invalid type should be rejected by validation
    expect(response.status).toBe(400);
  });

  test("Create placeholder with empty name", async () => {
    const placeholderData = {
      name: "",
      label: "Empty Name",
      description: "A placeholder with an empty name",
      type: "text",
      requiredByUser: true,
      defaultValue: "Default value",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders`,
      TEST_USER_1_TOKEN,
      placeholderData
    );

    // Empty name should be rejected by validation
    expect(response.status).toBe(400);
  });

  test("Create placeholder with very long name", async () => {
    // Create a very long name (1000 characters)
    const longName = "a".repeat(1000);

    const placeholderData = {
      name: longName,
      label: "Long Name",
      description: "A placeholder with a very long name",
      type: "text",
      requiredByUser: true,
      defaultValue: "Default value",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders`,
      TEST_USER_1_TOKEN,
      placeholderData
    );

    // Very long name should be rejected
    expect(response.status).toBe(400);
  });

  test("Create placeholder with duplicate name", async () => {
    // First, create a placeholder
    const placeholderData = {
      name: "duplicate-placeholder",
      label: "Duplicate Placeholder",
      description: "A placeholder for testing duplicates",
      type: "text",
      requiredByUser: true,
      defaultValue: "Default value",
    };

    await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders`,
      TEST_USER_1_TOKEN,
      placeholderData
    );

    // Now try to create another with the same name
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders`,
      TEST_USER_1_TOKEN,
      placeholderData
    );

    // Duplicate name should be rejected
    expect(response.status).toBe(400);
  });

  test("Get non-existent template", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates?id=${nonExistentId}`,
      TEST_USER_1_TOKEN
    );

    // Should return an empty array, not an error
    expect(response.status).toBe(400);
    expect(response.textResponse).toContain("Template not found");
  });

  test("Get non-existent placeholder", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders/${nonExistentId}`,
      TEST_USER_1_TOKEN
    );

    // Should return a 400 error
    expect(response.status).toBe(400);
  });

  test("Update non-existent template", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const updatedData = {
      id: nonExistentId,
      name: "non-existent-template",
      label: "Non-existent Template",
      description: "A template that doesn't exist",
      category: "edge-test",
      systemPrompt: "You are a helpful assistant.",
      userPrompt: "Please respond to: {{query}}",
      organisationId: TEST_ORGANISATION_1.id,
      promptTemplateId: createdTemplateId,
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${nonExistentId}`,
      TEST_USER_1_TOKEN,
      updatedData
    );

    // Should return a 400 error
    expect(response.status).toBe(400);
  });

  test("Delete non-existent template", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${nonExistentId}`,
      TEST_USER_1_TOKEN
    );

    // Should return a 400 error or a success with no effect
    expect([200, 400]).toContain(response.status);
  });

  // Clean up after edge case tests
  test("Clean up created template", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });
});
