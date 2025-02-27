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
let createdGroupId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;

  // Create a test group for edge case tests
  const groupData = {
    name: "edge-case-group",
    meta: { description: "A group for edge case testing" },
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

describe("Chat Groups API Edge Cases", () => {
  test("Create group with empty name", async () => {
    const groupData = {
      name: "",
      meta: { description: "A group with an empty name" },
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups`,
      TEST_USER_1_TOKEN,
      groupData
    );

    // Empty name should be rejected by validation
    expect(response.status).toBe(400);
  });

  test("Create group with very long name", async () => {
    // Create a very long name (1000 characters)
    const longName = "a".repeat(1000);

    const groupData = {
      name: longName,
      meta: { description: "A group with a very long name" },
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups`,
      TEST_USER_1_TOKEN,
      groupData
    );

    // Very long name should be rejected
    expect(response.status).toBe(400);
  });

  test("Create group with very large meta object", async () => {
    // Create a very large meta object
    const largeMeta = {
      description: "a".repeat(10000),
      extraData: Array(1000).fill("test data"),
    };

    const groupData = {
      name: "large-meta-group",
      meta: largeMeta,
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups`,
      TEST_USER_1_TOKEN,
      groupData
    );

    // The API should handle large meta objects appropriately
    // This might succeed or fail depending on the API limits
    expect([200, 400]).toContain(response.status);
  });

  test("Get history for non-existent group", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${nonExistentId}/history`,
      TEST_USER_1_TOKEN
    );

    // Should return an empty array, not an error
    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(response.jsonResponse.length).toBe(0);
  });

  test("Update non-existent group", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const updatedData = {
      name: "non-existent-group",
      meta: { description: "A group that doesn't exist" },
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${nonExistentId}`,
      TEST_USER_1_TOKEN,
      updatedData
    );

    // Should return a 404 or 400 error
    expect([400, 404]).toContain(response.status);
  });

  test("Delete non-existent group", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${nonExistentId}`,
      TEST_USER_1_TOKEN
    );

    // Should return a 400 error
    expect(response.status).toBe(400);
  });

  test("Add users with empty userIds array", async () => {
    const userData = {
      userIds: [],
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}/users`,
      TEST_USER_1_TOKEN,
      userData
    );

    // Empty userIds array should be handled gracefully
    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(response.jsonResponse.length).toBe(0);
  });

  test("Add non-existent users to group", async () => {
    const nonExistentUserId = "00000000-0000-0000-0000-000000000000";
    
    const userData = {
      userIds: [nonExistentUserId],
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}/users`,
      TEST_USER_1_TOKEN,
      userData
    );

    // Should return a 400 error due to foreign key constraint
    expect(response.status).toBe(400);
  });

  test("Remove users with empty userIds array", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}/users?userIds=`,
      TEST_USER_1_TOKEN
    );

    // Empty userIds should be handled gracefully
    expect(response.status).toBe(200);
  });

  test("Add users to non-existent group", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    
    const userData = {
      userIds: [TEST_USER_1.id],
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${nonExistentId}/users`,
      TEST_USER_1_TOKEN,
      userData
    );

    // Should return a 403 error since the user is not a member of a non-existent group
    expect(response.status).toBe(403);
  });

  // Clean up after edge case tests
  test("Clean up created group", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });
}); 