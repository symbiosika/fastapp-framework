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
let createdChatId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
});

describe("Chat API Endpoints", () => {
  test("Create an empty chat session", async () => {
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/ensure-session`,
      TEST_USER_1_TOKEN,
      {}
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.chatId).toBeDefined();

    // Save the ID for later tests
    createdChatId = response.jsonResponse.chatId;
  });

  test("Get chat history for the current user", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
  });

  test("Get chat history for a specific chat session", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history/${createdChatId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.chatId).toBe(createdChatId);
    expect(Array.isArray(response.jsonResponse.history)).toBe(true);
  });

  test("Chat with template", async () => {
    const chatData = {
      chatId: createdChatId,
      variables: {
        user_input: "Hello, AI assistant!",
      },
      llmOptions: {
        model: "gpt-3.5-turbo",
        temperature: 0.7,
      },
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat`,
      TEST_USER_1_TOKEN,
      chatData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.chatId).toBe(createdChatId);
    expect(response.jsonResponse.message).toBeDefined();
    expect(response.jsonResponse.message.role).toBe("assistant");
  });

  test("Update a chat message", async () => {
    // First, get the chat history to find a message ID
    const historyResponse = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history/${createdChatId}`,
      TEST_USER_1_TOKEN
    );

    // If there are messages in the history
    if (historyResponse.jsonResponse.history.length > 0) {
      const messageId = historyResponse.jsonResponse.history[2].meta?.id;

      if (messageId) {
        const updateData = {
          content: "Updated message content",
        };

        const response = await testFetcher.put(
          app,
          `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/${createdChatId}/message/${messageId}`,
          TEST_USER_1_TOKEN,
          updateData
        );

        expect(response.status).toBe(200);
        expect(response.jsonResponse.success).toBe(true);
      }
    }
  });

  // Cleanup test - run this last
  test("Delete a chat session", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history/${createdChatId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.success).toBe(true);
  });
});
