import { describe, test, expect } from "bun:test";
import { replaceVariables, replaceCustomPlaceholders } from "./replacer";
import type { CoreMessage } from "ai";
import type { ChatSessionContext } from "../chat-store";

const mockMessages: CoreMessage[] = [
  { content: "Hello, {{name}}!", role: "user" },
  { content: "Your order {{orderId}} is ready.", role: "system" },
];

const mockVariables = {
  name: "Alice",
  orderId: "12345",
};

const mockContext: ChatSessionContext = {
  chatId: "testChatId",
  userId: "testUserId",
  organisationId: "testOrganisationId",
};

describe("replaceVariables", () => {
  test("should replace variables correctly", async () => {
    const result = await replaceVariables(mockMessages, mockVariables);
    expect(result[0].content).toBe("Hello, Alice!");
    expect(result[1].content).toBe("Your order 12345 is ready.");
  });

  test("should leave unmatched variables unchanged", async () => {
    const result = await replaceVariables(mockMessages, {});
    expect(result[0].content).toBe("Hello, {{name}}!");
    expect(result[1].content).toBe("Your order {{orderId}} is ready.");
  });
});

const customMessages: CoreMessage[] = [
  { content: "This is a {{#custom placeholder}}.", role: "user" },
];

describe("replaceCustomPlaceholders", () => {
  const mockParsers = [
    {
      name: "custom",
      replacerFunction: async (match: string) => ({
        content: "replaced",
        skipThisBlock: false,
      }),
    },
  ];

  test("should replace custom placeholders correctly", async () => {
    const { replacedMessages } = await replaceCustomPlaceholders(
      customMessages,
      mockParsers,
      {},
      mockContext
    );
    expect(replacedMessages[0].content).toBe("This is a replaced.");
  });

  test("should handle no matches gracefully", async () => {
    const { replacedMessages } = await replaceCustomPlaceholders(
      mockMessages,
      mockParsers,
      {},
      mockContext
    );
    expect(replacedMessages[0].content).toBe("Hello, {{name}}!");
  });
});
