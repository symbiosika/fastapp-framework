import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineModelRoutes from ".";
import { initTests, TEST_ORGANISATION_1 } from "../../../../../test/init.test";
import { Hono } from "hono";
import type { FastAppHonoContextVariables } from "../../../../../types";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../../../lib/db/db-connection";
import type { AiProviderModelsInsert } from "../../../../../dbSchema";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let testModelId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineModelRoutes(app, "/api");
  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;

  // Create a test model for edge case tests
  const modelData: AiProviderModelsInsert = {
    name: "Edge Case Test Model",
    provider: "openai",
    model: "gpt-4",
    inputType: ["text"],
    outputType: ["text"],
    label: "Edge Case Test Model",
    description: "Test model for edge cases",
    maxTokens: 1000,
    maxOutputTokens: 1000,
    endpoint: "https://api.openai.com/v1/chat/completions",
    hostingOrigin: "https://api.openai.com",
    usesInternet: true,
    system: false,
    active: true,
    organisationId: TEST_ORGANISATION_1.id,
  };

  const response = await testFetcher.post(
    app,
    `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`,
    TEST_USER_1_TOKEN,
    modelData
  );

  testModelId = response.jsonResponse.id;
});

describe("AI Models API Edge Cases", () => {
  test("Create model with very long name", async () => {
    // Create a very long name (1000 characters)
    const longName = "a".repeat(1000);

    const modelData: AiProviderModelsInsert = {
      name: longName,
      provider: "openai",
      model: "gpt-4",
      inputType: ["text"],
      outputType: ["text"],
      label: "Long Name Model",
      description: "Test model with long name",
      maxTokens: 1000,
      maxOutputTokens: 1000,
      endpoint: "https://api.openai.com/v1/chat/completions",
      hostingOrigin: "https://api.openai.com",
      usesInternet: true,
      system: false,
      active: true,
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`,
      TEST_USER_1_TOKEN,
      modelData
    );

    // This might succeed or fail depending on the database schema constraints
    expect(response.status).toBe(400);
    expect(response.textResponse).toContain("Invalid length");
  });

  test("Get model with invalid ID format", async () => {
    const invalidId = "invalid-id-format";

    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${invalidId}`,
      TEST_USER_1_TOKEN
    );

    // Should handle invalid ID format gracefully
    expect(response.status).toBe(500);
    expect(response.textResponse).toContain("Failed to get AI provider model");
  });

  test("Create duplicate model", async () => {
    // Try to create a model with the same details as the test model
    const duplicateModelData = {
      name: "Edge Case Test Model", // Same name
      provider: "openai",
      model: "gpt-4",
      inputType: ["text"],
      outputType: ["text"],
      label: "Edge Case Test Model",
      description: "Test model for edge cases",
      maxTokens: 1000,
      maxOutputTokens: 1000,
      endpoint: "https://api.openai.com/v1/chat/completions",
      hostingOrigin: "https://api.openai.com",
      usesInternet: true,
      system: false,
      active: true,
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`,
      TEST_USER_1_TOKEN,
      duplicateModelData
    );

    // This might succeed or fail depending on if there are unique constraints
    // If it succeeds, we should clean up
    if (response.status === 200) {
      await testFetcher.delete(
        app,
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${response.jsonResponse.id}`,
        TEST_USER_1_TOKEN
      );
    }
  });

  test("Delete model twice", async () => {
    // Create a model to delete
    const modelData: AiProviderModelsInsert = {
      name: "Delete Twice Model",
      provider: "openai",
      model: "gpt-4-twice",
      inputType: ["text"],
      outputType: ["text"],
      label: "Delete Twice Model",
      description: "Test model for delete twice",
      maxTokens: 1000,
      maxOutputTokens: 1000,
      endpoint: "https://api.openai.com/v1/chat/completions",
      hostingOrigin: "https://api.openai.com",
      usesInternet: true,
      system: false,
      active: true,
      organisationId: TEST_ORGANISATION_1.id,
    };

    const createResponse = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`,
      TEST_USER_1_TOKEN,
      modelData
    );

    const modelId = createResponse.jsonResponse.id;

    // Delete the model first time
    const firstDeleteResponse = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${modelId}`,
      TEST_USER_1_TOKEN
    );

    expect(firstDeleteResponse.status).toBe(200);

    // Try to delete the same model again
    const secondDeleteResponse = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${modelId}`,
      TEST_USER_1_TOKEN
    );

    // Should fail because the model no longer exists
    console.log(secondDeleteResponse.textResponse);
    expect(secondDeleteResponse.status).toBe(500);
    expect(secondDeleteResponse.textResponse).toContain(
      "Failed to delete AI provider model"
    );
  });
});
