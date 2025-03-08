import { describe, test, expect, beforeAll, afterAll } from "bun:test";
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

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let TEST_USER_2_TOKEN: string;
let testModelId: string;

beforeAll(async () => {
  defineModelRoutes(app, "/api");
  const { user1Token, user2Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
  TEST_USER_2_TOKEN = user2Token;

  // Create a test model for security tests
  const modelData = {
    name: "Security Test Model",
    provider: "openai",
    model: "gpt-4",
    inputType: ["text"],
    outputType: ["text"],
    label: "Security Test Model",
    description: "Test model for security tests",
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

describe("AI Models API Security Tests", () => {
  test("Endpoints should reject unauthorized requests", async () => {
    await rejectUnauthorized(app, [
      ["GET", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`],
      [
        "GET",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${testModelId}`,
      ],
      ["POST", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models`],
      [
        "PUT",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${testModelId}`,
      ],
      [
        "DELETE",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${testModelId}`,
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

  test("User cannot access specific model in another organisation", async () => {
    // User 2 tries to access a specific model in organisation 1
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${testModelId}`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot create model in another organisation", async () => {
    const modelData = {
      name: "Unauthorized Model",
      provider: "openai",
      model: "gpt-4",
      inputType: ["text"],
      outputType: ["text"],
      label: "Unauthorized Model",
      description: "Test model for unauthorized access",
      maxTokens: 1000,
      maxOutputTokens: 1000,
      endpoint: "https://api.openai.com/v1/chat/completions",
      hostingOrigin: "https://api.openai.com",
      usesInternet: true,
      system: false,
      active: true,
      organisationId: TEST_ORGANISATION_1.id,
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
  });

  test("User cannot update model in another organisation", async () => {
    const updateData = {
      name: "Unauthorized Update",
    };

    // User 2 tries to update a model in organisation 1
    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${testModelId}`,
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
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${testModelId}`,
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
      `/api/organisation/${invalidOrgId}/models`,
      TEST_USER_1_TOKEN
    );

    // Should be rejected
    expect(getResponse.status).not.toBe(200);
  });

  test("SQL injection attempt in model ID should be handled safely", async () => {
    const maliciousId = "1'; DROP TABLE models; --";

    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${maliciousId}`,
      TEST_USER_1_TOKEN
    );

    // Should handle the malicious input safely
    expect(response.status).toBe(500);
    expect(response.textResponse).toContain("Failed to get AI provider model");
  });

  test("User can access their own organisation's models", async () => {
    // Create a model in organisation 2
    const modelData = {
      name: "Org 2 Security Model",
      provider: "openai",
      model: "gpt-4",
      inputType: ["text"],
      outputType: ["text"],
      label: "Org 2 Security Model",
      description: "Test model for org 2",
      maxTokens: 1000,
      maxOutputTokens: 1000,
      endpoint: "https://api.openai.com/v1/chat/completions",
      hostingOrigin: "https://api.openai.com",
      usesInternet: true,
      system: false,
      active: true,
      organisationId: TEST_ORGANISATION_2.id,
    };

    const createResponse = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_2.id}/ai/models`,
      TEST_USER_2_TOKEN,
      modelData
    );

    // Should be allowed
    console.log(createResponse.textResponse);
    expect(createResponse.status).toBe(200);

    // User 2 accesses their own organisation's models
    const getResponse = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_2.id}/ai/models`,
      TEST_USER_2_TOKEN
    );

    // Should be allowed
    expect(getResponse.status).toBe(200);
    expect(Array.isArray(getResponse.jsonResponse)).toBe(true);

    // Clean up - delete the created model
    if (createResponse.jsonResponse?.id) {
      await testFetcher.delete(
        app,
        `/api/organisation/${TEST_ORGANISATION_2.id}/ai/models/${createResponse.jsonResponse.id}`,
        TEST_USER_2_TOKEN
      );
    }
  });
});

// Clean up the test model
afterAll(async () => {
  await testFetcher.delete(
    app,
    `/api/organisation/${TEST_ORGANISATION_1.id}/ai/models/${testModelId}`,
    TEST_USER_1_TOKEN
  );
});
