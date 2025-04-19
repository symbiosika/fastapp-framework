import { describe, test, expect, beforeAll } from "bun:test";
import { chatStore } from ".";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../lib/db/db-connection";
import { nanoid } from "nanoid";
import { TEST_ORG1_USER_1, TEST_ORGANISATION_1 } from "../../../test/init.test";

let TEST_CHAT_ID: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();
});

describe("Chat Store", () => {
  test("Create a new chat session", async () => {
    const session = await chatStore.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
          meta: {
            id: nanoid(8),
            human: false,
            timestamp: new Date().toISOString(),
          },
        },
      ],
      variables: {
        user_input: "Hello, assistant!",
      },
      context: {
        userId: TEST_ORG1_USER_1.id,
        organisationId: TEST_ORGANISATION_1.id,
      },
    });

    expect(session).toBeDefined();
    expect(session.id).toBeDefined();
    expect(session.userId).toBe(TEST_ORG1_USER_1.id);
    expect(session.organisationId).toBe(TEST_ORGANISATION_1.id);
    expect(session.messages.length).toBe(1);
    expect(session.messages[0].role).toBe("system");
    // expect(session.state.variables.user_input).toBe("Hello, assistant!");

    // Save the ID for later tests
    TEST_CHAT_ID = session.id;
  });

  test("Check if session exists", async () => {
    const exists = await chatStore.checkIfSessionExists(TEST_CHAT_ID);
    expect(exists).toBe(true);

    const nonExistentExists =
      await chatStore.checkIfSessionExists("non-existent-id");
    expect(nonExistentExists).toBe(false);
  });

  test("Get a chat session", async () => {
    const session = await chatStore.get(TEST_CHAT_ID);
    expect(session).toBeDefined();
    expect(session?.id).toBe(TEST_CHAT_ID);
    expect(session?.userId).toBe(TEST_ORG1_USER_1.id);
    expect(session?.organisationId).toBe(TEST_ORGANISATION_1.id);
  });

  test("Update a chat session", async () => {
    const updatedSession = await chatStore.set(TEST_CHAT_ID, {
      name: "Updated Chat Session",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
          meta: {
            id: nanoid(8),
            human: false,
            timestamp: new Date().toISOString(),
          },
        },
        {
          role: "user",
          content: "Hello, assistant!",
          meta: {
            id: nanoid(8),
            human: true,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    });

    expect(updatedSession).toBeDefined();
    expect(updatedSession.name).toBe("Updated Chat Session");
    expect(updatedSession.messages.length).toBe(2);
    expect(updatedSession.messages[1].role).toBe("user");
  });

  test("Get chat history by user ID", async () => {
    const history = await chatStore.getHistoryByUserId(
      TEST_ORG1_USER_1.id,
      "2000-01-01",
      { organisationId: TEST_ORGANISATION_1.id }
    );

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    expect(history.some((session) => session.id === TEST_CHAT_ID)).toBe(true);
  });

  test("Get chat history for a specific chat", async () => {
    const messages = await chatStore.getChatHistory(TEST_CHAT_ID);
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBe(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
  });

  test("Update a chat message", async () => {
    // First get the messages to find a message ID
    const messages = await chatStore.getChatHistory(TEST_CHAT_ID);
    const messageId = messages[1].meta?.id; // User message ID

    if (messageId) {
      await chatStore.updateChatMessage(
        TEST_CHAT_ID,
        messageId,
        {
          content: "Updated user message",
        },
        TEST_ORGANISATION_1.id
      );

      // Verify the update
      const updatedMessages = await chatStore.getChatHistory(TEST_CHAT_ID);
      expect(updatedMessages[1].content).toBe("Updated user message");
    }
  });

  // Clean up after all tests
  test("Delete a chat session", async () => {
    await chatStore.drop(TEST_CHAT_ID);

    // Verify it's gone
    const session = await chatStore.get(TEST_CHAT_ID);
    expect(session).toBeNull();
  });
});
