import { describe, test, expect, mock } from "bun:test";
import {
  functionTool,
  webSearchTool,
  textToSpeechTool,
  speechToTextTool,
} from "./tool";
import { TEST_USER_1, TEST_ORGANISATION_1 } from "../../../test/init.test";

// Mock the standard AI module
mock.module("../standard", () => {
  return {
    textToSpeech: mock(() =>
      Promise.resolve({
        file: new File(["test"], "test.mp3", { type: "audio/mp3" }),
        filename: "test.mp3",
        meta: {
          model: "tts-1",
          provider: "openai",
        },
      })
    ),
    speechToText: mock(() =>
      Promise.resolve({
        text: "This is a transcription test",
        segments: [{ text: "This is a transcription test", start: 0, end: 3 }],
        words: [{ word: "test", start: 2.5, end: 3 }],
        meta: {
          model: "whisper-1",
          provider: "openai",
        },
      })
    ),
  };
});

describe("Agent Tools", () => {
  test("Create a function tool with a named function", async () => {
    async function getWeather(args: { city: string }, context: any) {
      return {
        temperature: 22,
        conditions: "Sunny",
        city: args.city,
      };
    }

    const tool = functionTool(getWeather);

    expect(tool).toBeDefined();
    expect(tool.name).toBe("getWeather");
    expect(tool.description).toContain("getWeather");
    expect(tool.function).toBeDefined();

    // Test the function execution
    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id,
    };

    const result = await tool.function({ city: "Berlin" }, context);
    expect(result).toBeDefined();
    expect(result.temperature).toBe(22);
    expect(result.conditions).toBe("Sunny");
    expect(result.city).toBe("Berlin");
  });

  test("Create a function tool with an anonymous function and options", async () => {
    const tool = functionTool(
      async (args: { query: string }, context: any) => {
        return `Results for ${args.query}`;
      },
      {
        name: "search",
        description: "Search for information",
        parameters: {
          query: {
            type: "string",
            description: "The search query",
          },
        },
      }
    );

    expect(tool).toBeDefined();
    expect(tool.name).toBe("search");
    expect(tool.description).toBe("Search for information");
    expect(tool.parameters).toBeDefined();

    // Check parameters if defined
    if (tool.parameters) {
      expect(tool.parameters.query).toBeDefined();
    }

    // Test the function execution
    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id,
    };

    const result = await tool.function({ query: "test query" }, context);
    expect(result).toBe("Results for test query");
  });

  test("Create a function tool without a name should throw an error", () => {
    expect(() => {
      functionTool(async (args: any, context: any) => {
        return "result";
      });
    }).toThrow();
  });

  test("Create a web search tool", async () => {
    const tool = webSearchTool();

    expect(tool).toBeDefined();
    expect(tool.name).toBe("web_search");
    expect(tool.description).toContain("Search the web");
    expect(tool.parameters).toBeDefined();

    // Check parameters if defined
    if (tool.parameters) {
      expect(tool.parameters.query).toBeDefined();
      expect(tool.parameters.maxResults).toBeDefined();
    }

    // Test the function execution
    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id,
    };

    const result = await tool.function({ query: "test query" }, context);
    expect(result).toBeDefined();
    expect(result.results).toBeDefined();
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].title).toContain("test query");
  });

  test("Create a web search tool with custom options", async () => {
    const tool = webSearchTool({
      name: "custom_search",
      description: "Custom web search",
      maxResults: 10,
    });

    expect(tool).toBeDefined();
    expect(tool.name).toBe("custom_search");
    expect(tool.description).toBe("Custom web search");

    // Check parameters if defined
    if (tool.parameters) {
      expect(tool.parameters.maxResults.default).toBe(10);
    }
  });

  test("Create a text-to-speech tool", async () => {
    const tool = textToSpeechTool();

    expect(tool).toBeDefined();
    expect(tool.name).toBe("text_to_speech");
    expect(tool.description).toContain("Convert text to speech");
    expect(tool.parameters).toBeDefined();

    // Check parameters if defined
    if (tool.parameters) {
      expect(tool.parameters.text).toBeDefined();
      expect(tool.parameters.voice).toBeDefined();
      expect(tool.parameters.speed).toBeDefined();
    }

    // Test the function execution
    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id,
    };

    const result = await tool.function(
      { text: "Convert this text to speech" },
      context
    );
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.file).toBeDefined();
    expect(result.filename).toBe("test.mp3");
  });

  test("Create a text-to-speech tool with custom options", async () => {
    const tool = textToSpeechTool({
      name: "custom_tts",
      description: "Custom text-to-speech conversion",
      voice: "echo",
    });

    expect(tool).toBeDefined();
    expect(tool.name).toBe("custom_tts");
    expect(tool.description).toBe("Custom text-to-speech conversion");

    // Check parameters if defined
    if (tool.parameters) {
      expect(tool.parameters.voice.default).toBe("echo");
    }
  });

  test("Create a speech-to-text tool", async () => {
    const tool = speechToTextTool();

    expect(tool).toBeDefined();
    expect(tool.name).toBe("speech_to_text");
    expect(tool.description).toContain("Convert speech audio to text");
    expect(tool.parameters).toBeDefined();

    // Check parameters if defined
    if (tool.parameters) {
      expect(tool.parameters.filePath).toBeDefined();
      expect(tool.parameters.returnSegments).toBeDefined();
      expect(tool.parameters.returnWords).toBeDefined();
    }

    // Test the function execution
    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id,
    };

    const result = await tool.function(
      { filePath: "/path/to/audio.mp3" },
      context
    );
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.text).toBe("This is a transcription test");
    expect(result.segments).toBeDefined();
    expect(result.words).toBeDefined();
  });

  test("Create a speech-to-text tool with custom options", async () => {
    const tool = speechToTextTool({
      name: "custom_stt",
      description: "Custom speech-to-text conversion",
      returnSegments: true,
      returnWords: true,
    });

    expect(tool).toBeDefined();
    expect(tool.name).toBe("custom_stt");
    expect(tool.description).toBe("Custom speech-to-text conversion");

    // Check parameters if defined
    if (tool.parameters) {
      expect(tool.parameters.returnSegments.default).toBe(true);
      expect(tool.parameters.returnWords.default).toBe(true);
    }
  });
});
