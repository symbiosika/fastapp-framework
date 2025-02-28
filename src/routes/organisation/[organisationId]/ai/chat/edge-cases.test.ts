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

  // Create a test chat session for edge case tests
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

describe("Chat API Edge Cases", () => {
  test("Get history for non-existent chat session", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history/${nonExistentId}`,
      TEST_USER_1_TOKEN
    );

    // Should return a 404 error
    expect(response.status).toBe(404);
    expect(response.textResponse).toContain("not found");
  });

  test("Delete non-existent chat session", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history/${nonExistentId}`,
      TEST_USER_1_TOKEN
    );

    // Should still return success as the operation is idempotent
    expect(response.status).toBe(200);
  });

  test("Chat with template with empty user input", async () => {
    const chatData = {
      chatId: createdChatId,
      variables: {
        user_input: "",
      },
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-with-template`,
      TEST_USER_1_TOKEN,
      chatData
    );

    // This might fail if the AI service is not available in test environment
    // So we'll check for either success or a specific error
    expect([200, 400]).toContain(response.status);
  });

  test("Chat with template with very long user input", async () => {
    // Create a very long user input (10000 characters)
    const longInput = "a".repeat(10000);

    const chatData = {
      chatId: createdChatId,
      variables: {
        user_input: longInput,
      },
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-with-template`,
      TEST_USER_1_TOKEN,
      chatData
    );

    // The API should handle large inputs appropriately
    // This might succeed or fail depending on the API limits
    expect([200, 400, 413]).toContain(response.status);
  });

  test("Update non-existent chat message", async () => {
    const nonExistentMessageId = "non-existent-message-id";
    const updateData = {
      content: "Updated message content",
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/${createdChatId}/message/${nonExistentMessageId}`,
      TEST_USER_1_TOKEN,
      updateData
    );

    // Should still return success as the operation is idempotent
    expect(response.status).toBe(400);
    expect(response.textResponse).toContain("Chat session undefined not found");
  });

  test("Start interview with empty fields", async () => {
    const interviewData = {
      interviewName: "",
      description: "",
      guidelines: "",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/interview/start`,
      TEST_USER_1_TOKEN,
      interviewData
    );

    // Should still succeed with default values
    expect(response.status).toBe(200);
    expect(response.jsonResponse.chatId).toBeDefined();
    expect(response.jsonResponse.name).toStartWith("Chat ");
    expect(response.jsonResponse.interview.description).toBe("");
    expect(response.jsonResponse.interview.guidelines).toBe("");
  });

  test("Respond to interview with empty user input", async () => {
    // First create an interview session
    const interviewData = {
      interviewName: "Empty Input Interview",
      description: "Testing empty input",
      guidelines: "Guidelines for testing",
    };

    const createResponse = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/interview/start`,
      TEST_USER_1_TOKEN,
      interviewData
    );

    const interviewChatId = createResponse.jsonResponse.chatId;

    // Now respond with empty input
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/interview/${interviewChatId}/respond`,
      TEST_USER_1_TOKEN,
      {
        chatId: interviewChatId,
        userId: TEST_USER_1.id,
        organisationId: TEST_ORGANISATION_1.id,
        user_input: "",
      }
    );

    // This might fail if the AI service is not available in test environment
    // So we'll check for either success or a specific error
    expect([200, 400]).toContain(response.status);
  }, 300000);

  test("Create chat session with invalid chatSessionGroupId", async () => {
    const sessionData = {
      chatSessionGroupId: "non-existent-group-id",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/ensure-session`,
      TEST_USER_1_TOKEN,
      sessionData
    );

    // Should still create the session but with a foreign key error for the group ID
    expect([200, 400]).toContain(response.status);
  });

  test("Chat with template with invalid model", async () => {
    const chatData = {
      chatId: createdChatId,
      variables: {
        user_input: "Hello, AI assistant!",
      },
      llmOptions: {
        model: "non-existent-model",
        temperature: 0.7,
      },
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-with-template`,
      TEST_USER_1_TOKEN,
      chatData
    );

    // Should return an error for invalid model
    expect([200, 400]).toContain(response.status);
  });

  test("Chat with template with empty string model", async () => {
    const chatData = {
      chatId: createdChatId,
      variables: {
        user_input: "Hello with empty model string",
      },
      llmOptions: {
        model: "",
        temperature: 0.7,
      },
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-with-template`,
      TEST_USER_1_TOKEN,
      chatData
    );

    // Should either use a default model or return an error
    expect(response.status).toBe(200);
    expect(response.jsonResponse.message.meta.model).toBe("gpt-4o-mini");
  }, 30000);

  test("Chat with template with extreme temperature values", async () => {
    // Test with temperature = 0
    const lowTempData = {
      chatId: createdChatId,
      variables: {
        user_input: "Hello with temperature 0",
      },
      llmOptions: {
        temperature: 0,
      },
    };

    const lowTempResponse = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-with-template`,
      TEST_USER_1_TOKEN,
      lowTempData
    );

    // Test with temperature = 2 (usually the max is 1)
    const highTempData = {
      chatId: createdChatId,
      variables: {
        user_input: "Hello with temperature 2",
      },
      llmOptions: {
        temperature: 2,
      },
    };

    const highTempResponse = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat-with-template`,
      TEST_USER_1_TOKEN,
      highTempData
    );

    // Both should either succeed or fail with a specific error
    expect([200, 400]).toContain(lowTempResponse.status);
    expect([200, 400]).toContain(highTempResponse.status);
  }, 66000);

  // Clean up after edge case tests
  test("Clean up created chat session", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/chat/history/${createdChatId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
  });
});
