import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineModelRoutes from ".";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_ORGANISATION_2,
} from "../../../../../test/init.test";
import { Hono } from "hono";
import type { FastAppHonoContextVariables } from "../../../../../types";
import { rejectUnauthorized } from "../../../../../test/reject-unauthorized.test";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../../../lib/db/db-connection";
import { getDb } from "../../../../../dbSchema";
import {
  aiProviderModels,
  type AiProviderModelsInsert,
} from "../../../../../lib/db/schema/models";
import { eq } from "drizzle-orm";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let TEST_USER_2_TOKEN: string;
let testModelId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineModelRoutes(app, "/api");
  const { user1Token, user2Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
  TEST_USER_2_TOKEN = user2Token;
});

describe("AI Models API Endpoints", () => {
  test("Create a new AI provider model", async () => {
    const modelData: AiProviderModelsInsert = {
      name: "Test Model",
      label: "Test Model",
      provider: "openai",
      model: "gpt-4",
      organisationId: TEST_ORGANISATION_1.id,
      inputType: ["text"],
      outputType: ["text"],
      description: "Test model",
      maxTokens: 1000,
      maxOutputTokens: 1000,
      endpoint: "https://api.openai.com/v1/chat/completions",
      hostingOrigin: "https://api.openai.com",
      usesInternet: true,
      system: false,
      active: true,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`,
      TEST_USER_1_TOKEN,
      modelData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toBeDefined();
    expect(response.jsonResponse.name).toBe(modelData.name);
    expect(response.jsonResponse.provider).toBe(modelData.provider);
    expect(response.jsonResponse.model).toBe(modelData.model);
    expect(response.jsonResponse.label).toBe(modelData.label);
    expect(response.jsonResponse.organisationId).toBe(modelData.organisationId);
    expect(response.jsonResponse.id).toBeDefined();

    // Save the model ID for later tests
    testModelId = response.jsonResponse.id;
  });

  test("Get all AI provider models for an organisation", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(response.jsonResponse.length).toBeGreaterThan(0);

    // Check if our test model is in the list
    const foundModel = response.jsonResponse.find(
      (model: any) => model.id === testModelId
    );
    expect(foundModel).toBeDefined();
    expect(foundModel.name).toBe("Test Model");
  });

  test("Get a single AI provider model by ID", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${testModelId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toBeDefined();
    expect(response.jsonResponse.id).toBe(testModelId);
    expect(response.jsonResponse.name).toBe("Test Model");
    expect(response.jsonResponse.provider).toBe("openai");
    expect(response.jsonResponse.model).toBe("gpt-4");
  });

  test("Update an AI provider model", async () => {
    const updateData = {
      name: "Updated Test Model",
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${testModelId}`,
      TEST_USER_1_TOKEN,
      updateData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toBeDefined();
    expect(response.jsonResponse.id).toBe(testModelId);
    expect(response.jsonResponse.name).toBe(updateData.name);
    expect(response.jsonResponse.provider).toBe("openai"); // Unchanged
    expect(response.jsonResponse.model).toBe("gpt-4"); // Unchanged
  });

  test("Delete an AI provider model", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${testModelId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toBeDefined();
    expect(response.jsonResponse.success).toBe(true);

    // Verify the model was deleted
    const deletedModelCheck = await getDb().query.aiProviderModels.findFirst({
      where: eq(aiProviderModels.id, testModelId),
    });

    expect(deletedModelCheck).toBeUndefined();
  });
});

describe("AI Models API Edge Cases", () => {
  test("Create model with missing required fields", async () => {
    const incompleteModelData = {
      name: "Incomplete Model",
      // Missing required fields
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`,
      TEST_USER_1_TOKEN,
      incompleteModelData
    );

    expect(response.status).toBe(400);
  });

  test("Get non-existent model", async () => {
    const nonExistentId = "non-existent-id";

    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${nonExistentId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(500);
    expect(response.textResponse).toContain("Failed to get AI provider model");
  });

  test("Update non-existent model", async () => {
    const nonExistentId = "non-existent-id";
    const updateData = {
      name: "Updated Non-existent Model",
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${nonExistentId}`,
      TEST_USER_1_TOKEN,
      updateData
    );

    expect(response.status).toBe(500);
    expect(response.textResponse).toContain(
      "Failed to update AI provider model"
    );
  });

  test("Delete non-existent model", async () => {
    const nonExistentId = "non-existent-id";

    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${nonExistentId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(500);
    expect(response.textResponse).toContain(
      "Failed to delete AI provider model"
    );
  });

  test("Create model with mismatched organisation ID", async () => {
    const mismatchedOrgData: AiProviderModelsInsert = {
      name: "Mismatched Org Model",
      provider: "openai",
      model: "gpt-4",
      organisationId: TEST_ORGANISATION_2.id, // Different from URL
      inputType: ["text"],
      outputType: ["text"],
      label: "Mismatched Org Model",
      description: "Mismatched org model",
      maxTokens: 1000,
      maxOutputTokens: 1000,
      endpoint: "https://api.openai.com/v1/chat/completions",
      hostingOrigin: "https://api.openai.com",
      usesInternet: true,
      system: false,
      active: true,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`,
      TEST_USER_1_TOKEN,
      mismatchedOrgData
    );

    expect(response.status).toBe(403);
    expect(response.textResponse).toContain(
      "The organisationId in the body does not match the organisationId in the path"
    );
  });
});

describe("AI Models API Security Tests", () => {
  let securityTestModelId: string;

  // Create a test model for security tests
  beforeAll(async () => {
    const modelData = {
      name: "Security Test Model",
      provider: "openai",
      model: "gpt-4",
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`,
      TEST_USER_1_TOKEN,
      modelData
    );

    securityTestModelId = response.jsonResponse.id;
  });

  test("Endpoints should reject unauthorized requests", async () => {
    await rejectUnauthorized(app, [
      ["GET", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`],
      [
        "GET",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${securityTestModelId}`,
      ],
      ["POST", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`],
      [
        "PUT",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${securityTestModelId}`,
      ],
      [
        "DELETE",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${securityTestModelId}`,
      ],
    ]);
  });

  test("User cannot access models in another organisation", async () => {
    // User 2 tries to access organisation 1's models
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot create model in another organisation", async () => {
    const modelData: AiProviderModelsInsert = {
      name: "Unauthorized Model",
      provider: "openai",
      model: "gpt-4",
      organisationId: TEST_ORGANISATION_1.id,
      inputType: ["text"],
      outputType: ["text"],
      label: "Unauthorized Model",
      description: "Unauthorized model",
      maxTokens: 1000,
      maxOutputTokens: 1000,
      endpoint: "https://api.openai.com/v1/chat/completions",
      hostingOrigin: "https://api.openai.com",
      usesInternet: true,
      system: false,
      active: true,
    };

    // User 2 tries to create a model in organisation 1
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`,
      TEST_USER_2_TOKEN,
      modelData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
    expect(response.textResponse).toContain(
      "User is not a member of this organisation"
    );
  });

  test("User cannot update model in another organisation", async () => {
    const updateData = {
      name: "Unauthorized Update",
    };

    // User 2 tries to update a model in organisation 1
    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${securityTestModelId}`,
      TEST_USER_2_TOKEN,
      updateData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot delete model in another organisation", async () => {
    // User 2 tries to delete a model in organisation 1
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${securityTestModelId}`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("Invalid organisation ID should be rejected", async () => {
    const invalidOrgId = "invalid-org-id";

    // Try to access models with invalid organisation ID
    const getResponse = await testFetcher.get(
      app,
      `/api/organisation/${invalidOrgId}/ai/models`,
      TEST_USER_1_TOKEN
    );

    // Should be rejected
    expect(getResponse.status).not.toBe(200);
  });
});
