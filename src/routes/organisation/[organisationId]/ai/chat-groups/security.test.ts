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
let createdGroupId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token, user2Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
  TEST_USER_2_TOKEN = user2Token;

  // Create a test group for security tests
  const groupData = {
    name: "security-test-group",
    meta: { description: "A group for security testing" },
    organisationId: TEST_ORGANISATION_1.id,
  };

  const response = await testFetcher.post(
    app,
    `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups`,
    TEST_USER_1_TOKEN,
    groupData
  );

  createdGroupId = response.jsonResponse.id;
});

describe("Chat Groups API Security Tests", () => {
  test("Endpoints should reject unauthorized requests", async () => {
    await rejectUnauthorized(app, [
      ["GET", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups`],
      ["POST", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups`],
      [
        "PUT",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}`,
      ],
      [
        "DELETE",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}`,
      ],
      [
        "GET",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}/history`,
      ],
      [
        "POST",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}/users`,
      ],
      [
        "DELETE",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}/users`,
      ],
    ]);
  });

  test("User cannot access chat groups in another organisation", async () => {
    // User 2 tries to access organisation 1's chat groups
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot create chat group in another organisation", async () => {
    const groupData = {
      name: "unauthorized-group",
      meta: { description: "A group that should not be created" },
      organisationId: TEST_ORGANISATION_1.id,
    };

    // User 2 tries to create a group in organisation 1
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups`,
      TEST_USER_2_TOKEN,
      groupData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot update chat group in another organisation", async () => {
    const updatedData = {
      name: "security-test-group",
      meta: { description: "This group has been hacked" },
      organisationId: TEST_ORGANISATION_1.id,
    };

    // User 2 tries to update a group in organisation 1
    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}`,
      TEST_USER_2_TOKEN,
      updatedData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot delete chat group in another organisation", async () => {
    // User 2 tries to delete a group in organisation 1
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot access chat history in another organisation", async () => {
    // User 2 tries to access chat history in organisation 1
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}/history`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot add users to chat group in another organisation", async () => {
    const userData = {
      userIds: ["some-user-id"],
    };

    // User 2 tries to add users to a group in organisation 1
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}/users`,
      TEST_USER_2_TOKEN,
      userData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot remove users from chat group in another organisation", async () => {
    // User 2 tries to remove users from a group in organisation 1
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}/users?userIds=some-user-id`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
    expect(response.textResponse).toContain(
      "User is not a member of this organisation"
    );
  });

  test("Organisation ID mismatch in body and URL should be rejected", async () => {
    const groupData = {
      name: "mismatch-group",
      meta: { description: "A group with mismatched organisation IDs" },
      organisationId: TEST_ORGANISATION_2.id, // Mismatch with URL
    };

    // Try to create a group with mismatched organisation IDs
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups`,
      TEST_USER_1_TOKEN,
      groupData
    );

    // Should be rejected due to organisation ID mismatch
    expect(response.status).toBe(403);
    expect(response.textResponse).toContain(
      "The organisationId in the body does not match the organisationId in the path"
    );
  });

  test("Invalid organisation ID should be rejected", async () => {
    const invalidOrgId = "invalid-org-id";

    // Try to access chat groups with invalid organisation ID
    const response = await testFetcher.get(
      app,
      `/api/organisation/${invalidOrgId}/ai/chat-groups`,
      TEST_USER_1_TOKEN
    );

    // Should be rejected
    expect(response.status).not.toBe(200);
  });

  test("User can access their own organisation's endpoints", async () => {
    // User 2 accesses their own organisation's chat groups
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_2.id}/ai/chat-groups`,
      TEST_USER_2_TOKEN
    );

    // Should be allowed
    expect(response.status).toBe(200);
  });

  // Clean up after security tests
  test("Clean up created group", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });
});
