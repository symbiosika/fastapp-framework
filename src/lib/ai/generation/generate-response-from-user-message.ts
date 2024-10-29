import { describe, it, expect, beforeAll } from "bun:test";
import { generateResponseFromUserMessage } from ".";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "src/lib/db/db-connection";

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();
});

describe("generateResponseFromUserMessage", () => {
  it("should generate a response from a user message with knowledgebase placeholders", async () => {
    const message = {
      role: "user" as const,
      content:
        "Here is a test message with a {{!--#knowledgebase id=test}} placeholder",
    };

    const response = await generateResponseFromUserMessage(message);

    expect(response).toBeDefined();
    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe("string");
  });

  it("should handle messages without any special placeholders", async () => {
    const message = {
      role: "user" as const,
      content: "A simple message without any placeholders",
    };

    const response = await generateResponseFromUserMessage(message);

    expect(response).toBeDefined();
    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe("string");
  });

  it("should handle messages with multiple placeholder types", async () => {
    const message = {
      role: "user" as const,
      content: `
        Test message with multiple placeholders:
        {{!--#knowledgebase id=test}}
        {{!--#similar_to search_for=test}}
        {{!--#file id=test source=db}}
      `,
    };

    const response = await generateResponseFromUserMessage(message);

    expect(response).toBeDefined();
    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe("string");
  });
});
