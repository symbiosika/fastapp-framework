import { describe, test, expect, beforeAll } from "bun:test";
import {
  initTests,
  TEST_ORG1_USER_1,
  TEST_ORGANISATION_1,
} from "../../../test/init.test";
import { generateChatSummary } from "./index";
import { chatStore } from "../chat-store";

beforeAll(async () => {
  await initTests();
});

describe("Chat Summary", () => {
  test("should generate summary for a chat with messages", async () => {
    // Create a test chat session with some messages
    const testMessages = [
      {
        role: "user" as const,
        content: "Hello, I need help with setting up a new project in React.",
        meta: { id: "msg1", timestamp: new Date().toISOString() },
      },
      {
        role: "assistant" as const,
        content:
          "I'd be happy to help you set up a React project! First, make sure you have Node.js installed. Then you can use create-react-app to quickly set up a new project. Would you like me to walk you through the steps?",
        meta: { id: "msg2", timestamp: new Date().toISOString() },
      },
      {
        role: "user" as const,
        content: "Yes, please show me the exact commands to run.",
        meta: { id: "msg3", timestamp: new Date().toISOString() },
      },
      {
        role: "assistant" as const,
        content:
          "Here are the commands:\n1. npx create-react-app my-app\n2. cd my-app\n3. npm start\n\nThis will create a new React app and start the development server.",
        meta: { id: "msg4", timestamp: new Date().toISOString() },
      },
    ];

    const chatSession = await chatStore.create({
      context: {
        userId: TEST_ORG1_USER_1.id,
        organisationId: TEST_ORGANISATION_1.id,
      },
      messages: testMessages,
    });

    // Generate summary
    const summary = await generateChatSummary(
      TEST_ORG1_USER_1.id,
      chatSession.id,
      TEST_ORGANISATION_1.id
    );

    // Verify the summary
    expect(summary).toBeDefined();
    expect(typeof summary.summary).toBe("string");
    expect(summary.summary.length).toBeGreaterThan(0);
    expect(summary.summary.length).toBeLessThanOrEqual(500);
    expect(summary.summary.toLowerCase()).toContain("react");

    // Clean up
    await chatStore.drop(chatSession.id);
  });

  test("should return appropriate message for empty chat", async () => {
    // Create a test chat session with no messages
    const chatSession = await chatStore.create({
      context: {
        userId: TEST_ORG1_USER_1.id,
        organisationId: TEST_ORGANISATION_1.id,
      },
      messages: [],
    });

    // Generate summary
    const summary = await generateChatSummary(
      TEST_ORG1_USER_1.id,
      chatSession.id,
      TEST_ORGANISATION_1.id
    );

    // Verify the summary
    expect(summary.summary).toBe("No meaningful conversation content found.");

    // Clean up
    await chatStore.drop(chatSession.id);
  });

  test("should throw error for non-existent chat", async () => {
    expect(async () => {
      await generateChatSummary(
        TEST_ORG1_USER_1.id,
        "non-existent-chat-id",
        TEST_ORGANISATION_1.id
      );
    }).toThrow();
  });

  test("should throw error for wrong organisation", async () => {
    // Create a test chat session
    const chatSession = await chatStore.create({
      context: {
        userId: TEST_ORG1_USER_1.id,
        organisationId: TEST_ORGANISATION_1.id,
      },
      messages: [
        {
          role: "user" as const,
          content: "Test message",
          meta: { id: "msg1", timestamp: new Date().toISOString() },
        },
      ],
    });

    expect(async () => {
      await generateChatSummary(
        TEST_ORG1_USER_1.id,
        chatSession.id,
        "wrong-org-id"
      );
    }).toThrow();

    // Clean up
    await chatStore.drop(chatSession.id);
  });

  test("should handle system messages correctly", async () => {
    // Create a test chat session with system messages
    const testMessages = [
      {
        role: "system" as const,
        content: "You are a helpful AI assistant.",
        meta: { id: "sys1", timestamp: new Date().toISOString() },
      },
      {
        role: "user" as const,
        content: "What is the weather like today?",
        meta: { id: "msg1", timestamp: new Date().toISOString() },
      },
      {
        role: "assistant" as const,
        content:
          "I don't have access to real-time weather data, but I can help you find ways to check the weather.",
        meta: { id: "msg2", timestamp: new Date().toISOString() },
      },
    ];

    const chatSession = await chatStore.create({
      context: {
        userId: TEST_ORG1_USER_1.id,
        organisationId: TEST_ORGANISATION_1.id,
      },
      messages: testMessages,
    });

    // Generate summary
    const summary = await generateChatSummary(
      TEST_ORG1_USER_1.id,
      chatSession.id,
      TEST_ORGANISATION_1.id
    );

    // Verify the summary excludes system messages
    expect(summary).toBeDefined();
    expect(typeof summary.summary).toBe("string");
    expect(summary.summary.length).toBeGreaterThan(0);
    expect(summary.summary.toLowerCase()).toContain("weather");

    // Clean up
    await chatStore.drop(chatSession.id);
  });
});
