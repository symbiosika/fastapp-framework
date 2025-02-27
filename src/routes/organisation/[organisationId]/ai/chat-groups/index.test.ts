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
});

describe("Chat Groups API Endpoints", () => {
  test("Get all chat groups for the current user", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
  });

  test("Create a new chat group", async () => {
    const groupData = {
      name: "test-chat-group",
      meta: { description: "A test chat group for unit testing" },
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups`,
      TEST_USER_1_TOKEN,
      groupData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.name).toBe(groupData.name);
    expect(response.jsonResponse.organisationId).toBe(TEST_ORGANISATION_1.id);
    expect(response.jsonResponse.id).toBeDefined();

    // Save the ID for later tests
    createdGroupId = response.jsonResponse.id;
  });

  test("Get chat history for a group", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}/history`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
  });

  test("Update a chat group", async () => {
    const updatedData = {
      name: "updated-test-chat-group",
      meta: { description: "An updated test chat group" },
      organisationId: TEST_ORGANISATION_1.id,
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}`,
      TEST_USER_1_TOKEN,
      updatedData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.name).toBe(updatedData.name);
    expect(response.jsonResponse.meta).toEqual(updatedData.meta);
  });

  test("Add users to a chat group", async () => {
    const userData = {
      userIds: [TEST_USER_1.id], // Adding the same user for testing purposes
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}/users`,
      TEST_USER_1_TOKEN,
      userData
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    // The user is already a member, so this might not add a new entry
    // but it should still return successfully
  });

  test("Remove users from a chat group", async () => {
    // Note: In a real scenario, we would add a different user and then remove them
    // For this test, we'll try to remove a non-existent user which should still succeed
    const nonExistentUserId = "00000000-0000-0000-0000-000000000000";
    
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}/users?userIds=${nonExistentUserId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });

  // Cleanup test - run this last
  test("Delete a chat group", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-groups/${createdGroupId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });
}); 