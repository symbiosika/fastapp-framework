import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineRoutes from ".";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_ORGANISATION_2,
  TEST_USER_2,
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
let createdChatId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token, user2Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
  TEST_USER_2_TOKEN = user2Token;

  // Create a test chat session for security tests
  const sessionData = {
    chatSessionGroupId: null,
  };

  const response = await testFetcher.post(
    app,
    `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/ensure-session`,
    TEST_USER_1_TOKEN,
    sessionData
  );

  createdChatId = response.jsonResponse.chatId;
});

describe("Chat API Security Tests", () => {
  test("Endpoints should reject unauthorized requests", async () => {
    await rejectUnauthorized(app, [
      [
        "POST",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-with-template`,
      ],
      ["GET", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history`],
      [
        "GET",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history/${createdChatId}`,
      ],
      [
        "DELETE",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history/${createdChatId}`,
      ],
      [
        "POST",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/ensure-session`,
      ],
      [
        "PUT",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/${createdChatId}/message/some-message-id`,
      ],
    ]);
  });

  test("User cannot access chat history in another organisation", async () => {
    // User 2 tries to access chat history in organisation 1
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot access specific chat session in another organisation", async () => {
    // User 2 tries to access a specific chat session in organisation 1
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history/${createdChatId}`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot delete chat session in another organisation", async () => {
    // User 2 tries to delete a chat session in organisation 1
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history/${createdChatId}`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot create chat session in another organisation", async () => {
    const sessionData = {
      chatSessionGroupId: null,
    };

    // User 2 tries to create a chat session in organisation 1
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/ensure-session`,
      TEST_USER_2_TOKEN,
      sessionData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot chat with template in another organisation", async () => {
    const chatData = {
      chatId: createdChatId,
      variables: {
        user_input: "Hello, AI assistant!",
      },
    };

    // User 2 tries to chat with template in organisation 1
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-with-template`,
      TEST_USER_2_TOKEN,
      chatData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot update chat message in another organisation", async () => {
    const updateData = {
      content: "Updated message content",
    };

    // User 2 tries to update a chat message in organisation 1
    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/${createdChatId}/message/some-message-id`,
      TEST_USER_2_TOKEN,
      updateData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("Invalid organisation ID should be rejected", async () => {
    const invalidOrgId = "invalid-org-id";

    // Try to access chat history with invalid organisation ID
    const response = await testFetcher.get(
      app,
      `/api/organisation/${invalidOrgId}/ai/chat/history`,
      TEST_USER_1_TOKEN
    );

    // Should be rejected
    expect(response.status).not.toBe(200);
  });

  test("User can access their own organisation's endpoints", async () => {
    // User 2 accesses their own organisation's chat history
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_2.id}/ai/chat/history`,
      TEST_USER_2_TOKEN
    );

    // Should be allowed
    expect(response.status).toBe(200);
  });

  // Clean up after security tests
  test("Clean up created chat session", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history/${createdChatId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });
});
