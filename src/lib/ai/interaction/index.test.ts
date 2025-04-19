import { describe, it, expect, beforeAll } from "bun:test";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_ORG1_USER_1,
} from "../../../test/init.test";
import { chat } from "./index";
import { chatStore } from "../chat-store";
import { nanoid } from "nanoid";

const MODEL = "openai:gpt-4o-mini";

beforeAll(async () => {
  await initTests();
});

describe("Chat", () => {
  it("should start a chat with predefined ID and handle initial message exchange", async () => {
    // Arrange
    const predefinedChatId = nanoid(16);
    const initialMessage = "Hello, how are you?";

    // Act - Start chat with predefined ID
    const result = await chat({
      chatId: predefinedChatId,
      context: {
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_ORG1_USER_1.id,
      },
      options: {
        model: MODEL,
        temperature: 0.7,
      },
      input: initialMessage,
    });

    // Assert - Check initial response
    expect(result.chatId).toBe(predefinedChatId);
    expect(result.messages.length).toBe(3); // System message + User message + Assistant response
    expect(result.message.role).toBe("assistant");
    expect(result.message.content).toBeTruthy();

    // Verify chat store state
    const storedChat = await chatStore.get(predefinedChatId);
    expect(storedChat).toBeTruthy();
    expect(storedChat?.messages.length).toBe(3); // System + User + Assistant messages
    expect(storedChat?.organisationId).toBe(TEST_ORGANISATION_1.id);
    expect(storedChat?.userId).toBe(TEST_ORG1_USER_1.id);

    // Act - Send follow-up message
    const followUpResult = await chat({
      chatId: predefinedChatId,
      context: {
        organisationId: TEST_ORGANISATION_1.id,
        userId: TEST_ORG1_USER_1.id,
      },
      options: {
        model: MODEL,
        temperature: 0.7,
      },
      input: "What can you help me with?",
    });

    // Assert - Check message length increased
    expect(followUpResult.messages.length).toBe(5); // Previous 3 + new user + new assistant message
    expect(followUpResult.message.role).toBe("assistant");
    expect(followUpResult.message.content).toBeTruthy();

    // Verify final chat store state
    const updatedChat = await chatStore.get(predefinedChatId);
    expect(updatedChat?.messages.length).toBe(5);
  }, 15000);
});
