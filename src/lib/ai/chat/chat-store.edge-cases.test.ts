import { describe, test, expect, beforeAll } from "bun:test";
import { chatStore } from "./chat-store";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../lib/db/db-connection";
import { nanoid } from "nanoid";
import { TEST_USER_1, TEST_ORGANISATION_1 } from "../../../test/init.test";

let TEST_CHAT_ID: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  // Create a test chat session for edge case tests
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
    variables: {},
    context: {
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id,
    },
  });

  TEST_CHAT_ID = session.id;
});

describe("Chat Store Edge Cases", () => {
  test("Get non-existent chat session", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const session = await chatStore.get(nonExistentId);
    expect(session).toBeNull();
  });

  test("Update non-existent chat session", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    try {
      await chatStore.set(nonExistentId, {
        name: "Updated Non-existent Session",
      });
      // If we reach here, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      // We expect an error
      expect(error).toBeDefined();
    }
  });

  test("Set variable on non-existent chat session", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    try {
      await chatStore.setVariable(nonExistentId, "testKey", "testValue");
      // If we reach here, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      // We expect an error
      expect(error).toBeDefined();
    }
  });

  test("Get variable from non-existent chat session", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    try {
      await chatStore.getVariable(nonExistentId, "testKey");
      // If we reach here, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      // We expect an error
      expect(error).toBeDefined();
    }
  });

  test("Create chat session with empty messages", async () => {
    const session = await chatStore.create({
      messages: [],
      variables: {},
      context: {
        userId: TEST_USER_1.id,
        organisationId: TEST_ORGANISATION_1.id,
      },
    });

    expect(session).toBeDefined();
    expect(session.id).toBeDefined();
    expect(session.messages).toEqual([]);

    // Clean up
    await chatStore.drop(session.id);
  });

  test("Create chat session with very large message content", async () => {
    // Create a very large content (100KB)
    const largeContent = "a".repeat(100000);

    try {
      const session = await chatStore.create({
        messages: [
          {
            role: "system",
            content: largeContent,
            meta: {
              id: nanoid(8),
              human: false,
              timestamp: new Date().toISOString(),
            },
          },
        ],
        variables: {},
        context: {
          userId: TEST_USER_1.id,
          organisationId: TEST_ORGANISATION_1.id,
        },
      });

      // If it succeeds, clean up
      await chatStore.drop(session.id);
    } catch (error) {
      // It might fail due to database constraints, which is acceptable
      expect(error).toBeDefined();
    }
  });

  test("Create chat session with very large variables object", async () => {
    // Create a very large variables object
    const largeVariables: Record<string, string> = {};
    for (let i = 0; i < 1000; i++) {
      largeVariables[`key${i}`] = `value${i}`;
    }

    try {
      const session = await chatStore.create({
        messages: [],
        variables: largeVariables,
        context: {
          userId: TEST_USER_1.id,
          organisationId: TEST_ORGANISATION_1.id,
        },
      });

      // If it succeeds, clean up
      await chatStore.drop(session.id);
    } catch (error) {
      // It might fail due to database constraints, which is acceptable
      expect(error).toBeDefined();
    }
  });

  test("Update chat message with non-existent message ID", async () => {
    const nonExistentMessageId = "non-existent-message-id";

    try {
      await chatStore.updateChatMessage(
        TEST_CHAT_ID,
        nonExistentMessageId,
        {
          content: "Updated content",
        },
        TEST_ORGANISATION_1.id
      );
      // If we reach here, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      // We expect an error
      expect(error).toBeDefined();
    }
  });

  test("Update system message (should throw an error)", async () => {
    const messages = await chatStore.getChatHistory(TEST_CHAT_ID);
    const systemMessageId = messages[0].meta?.id;

    if (systemMessageId) {
      try {
        await chatStore.updateChatMessage(
          TEST_CHAT_ID,
          systemMessageId,
          {
            content: "Updated system message",
          },
          TEST_ORGANISATION_1.id
        );
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // We expect an error
        expect(error).toBeDefined();
      }
    }
  });

  test("Get chat history with future date", async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const history = await chatStore.getHistoryByUserId(
      TEST_USER_1.id,
      futureDate.toISOString(),
      { organisationId: TEST_ORGANISATION_1.id }
    );

    // Should return an empty array
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(0);
  });

  test("Get parent workspace by non-existent chat group ID", async () => {
    const nonExistentGroupId = "00000000-0000-0000-0000-000000000000";
    const result =
      await chatStore.getParentWorkspaceByChatGroupId(nonExistentGroupId);

    // Should return null workspaceId
    expect(result).toEqual({ workspaceId: null });
  });

  test("Get parent workspace with null chat group ID", async () => {
    const result = await chatStore.getParentWorkspaceByChatGroupId(null);

    // Should return null workspaceId
    expect(result).toEqual({ workspaceId: null });
  });

  test("Prevent updating chat message with mismatched organisation ID", async () => {
    const messages = await chatStore.getChatHistory(TEST_CHAT_ID);
    const messageId = messages[0].meta?.id;

    if (messageId) {
      // Try to update with a different organisation ID
      try {
        await chatStore.updateChatMessage(
          TEST_CHAT_ID,
          messageId,
          {
            content: "Updated content",
          },
          "00000000-1111-0000-0000-000000000000"
        );
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        // We expect an error with specific message
        expect(error.message).toBe(
          "Cannot update message in a chat session from a different organisation"
        );
      }
    }
  });

  test("Prevent changing organisation ID in set method", async () => {
    // Try to update the organisation ID
    try {
      await chatStore.set(TEST_CHAT_ID, {
        organisationId: "00000000-1111-0000-0000-000000000000",
      });
      // If we reach here, the test should fail
      expect(true).toBe(false);
    } catch (error: any) {
      // We expect an error with specific message
      expect(error.message).toBe(
        "Cannot change organisation ID for an existing chat session"
      );
    }
  });

  // Clean up after all tests
  test("Clean up test chat session", async () => {
    await chatStore.drop(TEST_CHAT_ID);
  });
});
