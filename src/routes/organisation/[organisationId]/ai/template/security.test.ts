import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineRoutes from ".";
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

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let TEST_USER_2_TOKEN: string;
let createdTemplateId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token, user2Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
  TEST_USER_2_TOKEN = user2Token;

  // Create a test template for security tests
  const templateData = {
    name: "security-test-template",
    label: "Security Test Template",
    description: "A template for security testing",
    category: "security-test",
    systemPrompt: "You are a helpful assistant for security testing.",
    userPrompt: "Please respond to: {{query}}",
    organisationId: TEST_ORGANISATION_1.id,
  };

  const response = await testFetcher.post(
    app,
    `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`,
    TEST_USER_1_TOKEN,
    templateData
  );

  createdTemplateId = response.jsonResponse.id;
});

describe("Prompt Templates API Security Tests", () => {
  test("Endpoints should reject unauthorized requests", async () => {
    await rejectUnauthorized(app, [
      ["GET", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`],
      ["POST", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`],
      [
        "PUT",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}`,
      ],
      [
        "DELETE",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}`,
      ],
      [
        "GET",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders`,
      ],
      [
        "POST",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders`,
      ],
      ["GET", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`],
      [
        "POST",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`,
      ],
    ]);
  });

  test("User cannot access templates in another organisation", async () => {
    // User 2 tries to access organisation 1's templates
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot create template in another organisation", async () => {
    const templateData = {
      name: "unauthorized-template",
      label: "Unauthorized Template",
      description: "A template that should not be created",
      category: "security-test",
      systemPrompt: "You are a helpful assistant.",
      userPrompt: "Please respond to: {{query}}",
      organisationId: TEST_ORGANISATION_1.id,
    };

    // User 2 tries to create a template in organisation 1
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`,
      TEST_USER_2_TOKEN,
      templateData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot update template in another organisation", async () => {
    const updatedData = {
      id: createdTemplateId,
      name: "security-test-template",
      label: "Hacked Template",
      description: "This template has been hacked",
      category: "security-test",
      systemPrompt: "You are a malicious assistant.",
      userPrompt: "Please respond to: {{query}}",
      organisationId: TEST_ORGANISATION_1.id,
    };

    // User 2 tries to update a template in organisation 1
    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}`,
      TEST_USER_2_TOKEN,
      updatedData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot delete template in another organisation", async () => {
    // User 2 tries to delete a template in organisation 1
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot access placeholders in another organisation", async () => {
    // User 2 tries to access placeholders in organisation 1
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot create placeholder in another organisation", async () => {
    const placeholderData = {
      name: "malicious",
      label: "Malicious",
      description: "A malicious placeholder",
      type: "text",
      requiredByUser: true,
      defaultValue: "Malicious value",
      promptTemplateId: createdTemplateId,
    };

    // User 2 tries to create a placeholder in organisation 1
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/placeholders`,
      TEST_USER_2_TOKEN,
      placeholderData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot access prompt snippets in another organisation", async () => {
    // User 2 tries to access organisation 1's prompt snippets
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot create prompt snippet in another organisation", async () => {
    const snippetData = {
      name: "malicious-snippet",
      content: "This is a malicious snippet.",
      category: "security-test",
      organisationId: TEST_ORGANISATION_1.id,
    };

    // User 2 tries to create a snippet in organisation 1
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`,
      TEST_USER_2_TOKEN,
      snippetData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("Invalid organisation ID should be rejected", async () => {
    const invalidOrgId = "invalid-org-id";

    // Try to access templates with invalid organisation ID
    const response = await testFetcher.get(
      app,
      `/api/organisation/${invalidOrgId}/ai/templates`,
      TEST_USER_1_TOKEN
    );

    // Should be rejected
    expect(response.status).not.toBe(200);
  });

  test("Organisation ID mismatch in body and URL should be rejected", async () => {
    const templateData = {
      name: "mismatch-template",
      label: "Mismatch Template",
      description: "A template with mismatched organisation IDs",
      category: "security-test",
      systemPrompt: "You are a helpful assistant.",
      userPrompt: "Please respond to: {{query}}",
      organisationId: TEST_ORGANISATION_2.id, // Mismatch with URL
    };

    // Try to create a template with mismatched organisation IDs
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`,
      TEST_USER_1_TOKEN,
      templateData
    );

    // Should be rejected due to organisation ID mismatch
    expect(response.status).toBe(400);
    expect(response.textResponse).toContain("does not match");
  });

  test("User can access their own organisation's endpoints", async () => {
    // User 2 accesses their own organisation's templates
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_2.id}/ai/templates`,
      TEST_USER_2_TOKEN
    );

    // Should be allowed
    expect(response.status).toBe(200);
  });

  // Clean up after security tests
  test("Clean up created template", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });
});
