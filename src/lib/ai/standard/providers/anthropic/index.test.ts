import { describe, test, expect, beforeAll } from "bun:test";
import { AnthropicProvider } from "./index";
import type { Message } from "../../types";

// Check if API key is available
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn(
    "⚠️ ANTHROPIC_API_KEY not found in environment variables. Tests will be skipped."
  );
}

// Create a provider instance for testing
const anthropicProvider = new AnthropicProvider(apiKey || "");

// Skip tests if no API key is available
const conditionalTest = apiKey ? test : test.skip;

describe("Anthropic Provider", () => {
  // Test the constructor
  test("Constructor should initialize with API key and default base URL", () => {
    const provider = new AnthropicProvider("test-api-key");
    expect(provider).toBeDefined();
  });

  // Test the generateText method
  conditionalTest(
    "generateText should return a valid response",
    async () => {
      const messages: Message[] = [
        {
          role: "user",
          content: "Hello, can you tell me what is the capital of France?",
        },
      ];

      const response = await anthropicProvider.generateText(messages);

      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(typeof response.text).toBe("string");
      expect(response.text.length).toBeGreaterThan(0);
      expect(response.meta).toBeDefined();
      expect(response.meta.provider).toBe("anthropic");
      expect(response.meta.model).toBeDefined();
    },
    30000
  );

  // Test the generateText method with JSON output
  conditionalTest(
    "generateText should return valid JSON when outputType is json",
    async () => {
      const messages: Message[] = [
        {
          role: "user",
          content:
            "Return a JSON object with the following structure: { name: 'Paris', country: 'France', population: 2161000 }",
        },
      ];

      const response = await anthropicProvider.generateText(messages, {
        outputType: "json",
      });

      expect(response).toBeDefined();
      expect(response.json).toBeDefined();
      expect(typeof response.json).toBe("object");
      expect(response.json.name).toBeDefined();
      expect(response.json.country).toBeDefined();
    },
    30000
  );

  // Test the generateText method with system message
  conditionalTest(
    "generateText should handle system messages correctly",
    async () => {
      const messages: Message[] = [
        {
          role: "system",
          content:
            "You are a helpful assistant that only responds with 'Yes' or 'No'.",
        },
        {
          role: "user",
          content: "Is Paris the capital of France?",
        },
      ];

      const response = await anthropicProvider.generateText(messages);

      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(
        ["Yes", "No"].some((answer) => response.text.includes(answer))
      ).toBe(true);
    },
    30000
  );

  // Test the generateText method with temperature parameter
  conditionalTest(
    "generateText should accept temperature parameter",
    async () => {
      const messages: Message[] = [
        {
          role: "user",
          content: "Write a short poem about the moon.",
        },
      ];

      const response = await anthropicProvider.generateText(messages, {
        temperature: 0.2,
      });

      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(typeof response.text).toBe("string");
      expect(response.text.length).toBeGreaterThan(0);
    },
    30000
  );

  // Test the generateLongText method
  conditionalTest(
    "generateLongText should return a response with desired word count",
    async () => {
      const messages: Message[] = [
        {
          role: "user",
          content: "Write a short story about a space explorer.",
        },
      ];

      const desiredWords = 200;
      const response = await anthropicProvider.generateLongText(messages, {
        desiredWords,
      });

      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(typeof response.text).toBe("string");

      // Count words in the response
      const wordCount = response.text
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      expect(wordCount).toBeGreaterThanOrEqual(desiredWords * 0.8); // Allow some flexibility
    },
    30000
  );

  // Test the generateLongText method with maxRetries
  conditionalTest(
    "generateLongText should respect maxRetries parameter",
    async () => {
      const messages: Message[] = [
        {
          role: "user",
          content: "Write a short paragraph about artificial intelligence.",
        },
      ];

      const response = await anthropicProvider.generateLongText(messages, {
        maxRetries: 1,
      });

      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(typeof response.text).toBe("string");
      expect(response.text.length).toBeGreaterThan(0);
    },
    30000
  );

  // Test error handling in generateText
  conditionalTest(
    "generateText should handle API errors gracefully",
    async () => {
      // Create a provider with an invalid API key
      const invalidProvider = new AnthropicProvider("invalid-api-key");

      const messages: Message[] = [
        {
          role: "user",
          content: "Hello, how are you?",
        },
      ];

      try {
        await invalidProvider.generateText(messages);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toContain(
          "Failed to generate text with Anthropic"
        );
      }
    },
    30000
  );
});
