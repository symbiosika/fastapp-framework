import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  BASE_TOOL_REGISTRY,
  DYNAMIC_TOOL_REGISTRY,
  TOOL_MEMORY,
  addBaseTool,
  addRuntimeTool,
  removeBaseTool,
  removeRuntimeTool,
  cleanupDynamicTools,
  getRuntimeToolsDictionary,
  addEntryToToolMemory,
  getToolMemory,
} from "./tools";
import type {
  SourceReturn,
  ArtifactReturn,
  ToolContext,
  ToolReturn,
} from "../ai-sdk/types";
import { type Tool } from "ai";

describe("Tools Registry", () => {
  // Sample tool for testing
  const testToolFactory = (context: ToolContext): ToolReturn => ({
    name: "test_tool",
    tool: {
      name: "test_tool",
      description: "A test tool",
      parameters: {
        type: "object",
        properties: {},
      },
    } as Tool,
  });

  beforeAll(() => {
    // Clear registries before each test
    Object.keys(BASE_TOOL_REGISTRY).forEach(
      (key) => delete BASE_TOOL_REGISTRY[key]
    );
    Object.keys(DYNAMIC_TOOL_REGISTRY).forEach(
      (key) => delete DYNAMIC_TOOL_REGISTRY[key]
    );
    Object.keys(TOOL_MEMORY).forEach((key) => delete TOOL_MEMORY[key]);
  });

  describe("Static Tool Registry", () => {
    test("should add a static tool", () => {
      addBaseTool("test_tool", "Test Tool", "A test tool", testToolFactory);
      expect(BASE_TOOL_REGISTRY["test_tool"]).toBeDefined();
      expect(BASE_TOOL_REGISTRY["test_tool"].toolFactory).toBeDefined();
      expect(BASE_TOOL_REGISTRY["test_tool"].meta).toEqual({
        name: "test_tool",
        label: "Test Tool",
        description: "A test tool",
      });
    });

    test("should remove a static tool", () => {
      addBaseTool("test_tool", "Test Tool", "A test tool", testToolFactory);
      removeBaseTool("test_tool");
      expect(BASE_TOOL_REGISTRY["test_tool"]).toBeUndefined();
    });
  });

  describe("Dynamic Tool Registry", () => {
    test("should add a dynamic tool", () => {
      const chatId = "test_chat";
      const tool = {
        name: "test_tool",
        description: "A test tool",
        parameters: {
          type: "object",
          properties: {},
        },
      } as Tool;
      addRuntimeTool(chatId, "test_tool", tool);
      expect(DYNAMIC_TOOL_REGISTRY[chatId]["test_tool"]).toBeDefined();
      expect(DYNAMIC_TOOL_REGISTRY[chatId]["test_tool"].tool).toEqual(tool);
      expect(
        DYNAMIC_TOOL_REGISTRY[chatId]["test_tool"].registeredAt
      ).toBeInstanceOf(Date);
    });

    test("should remove a dynamic tool", () => {
      const chatId = "test_chat";
      const tool = {
        name: "test_tool",
        description: "A test tool",
        parameters: {
          type: "object",
          properties: {},
        },
      } as Tool;
      addRuntimeTool(chatId, "test_tool", tool);
      removeRuntimeTool(chatId, "test_tool");
      expect(DYNAMIC_TOOL_REGISTRY[chatId]["test_tool"]).toBeUndefined();
    });

    test("should cleanup old dynamic tools", () => {
      const chatId = "test_chat";
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 2); // 2 hours old

      const tool = {
        name: "old_tool",
        description: "A test tool",
        parameters: {
          type: "object",
          properties: {},
        },
      } as Tool;

      DYNAMIC_TOOL_REGISTRY[chatId] = {
        old_tool: {
          registeredAt: oldDate,
          tool: tool,
          meta: {
            name: "old_tool",
            label: "",
            description: "",
          },
        },
      };

      cleanupDynamicTools();
      expect(DYNAMIC_TOOL_REGISTRY[chatId]["old_tool"]).toBeUndefined();
    });
  });

  describe("Tool Dictionary", () => {
    test("should return tools for a chat ID", () => {
      const chatId = "test_chat";
      const tool = {
        name: "test_tool",
        description: "A test tool",
        parameters: {
          type: "object",
          properties: {},
        },
      } as Tool;
      addRuntimeTool(chatId, "test_tool", tool);

      const tools = getRuntimeToolsDictionary(chatId);
      expect(tools).toBeDefined();
      expect(tools?.["test_tool"]).toEqual(tool);
    });

    test("should return empty dictionary for undefined chat ID", () => {
      const tools = getRuntimeToolsDictionary(undefined);
      expect(tools).toEqual({});
    });
  });

  describe("Tool Memory", () => {
    test("should add sources to tool memory", () => {
      const chatId = "test_chat";
      const testSource: SourceReturn = {
        type: "url",
        label: "test",
        url: "https://example.com",
      };

      addEntryToToolMemory(chatId, {
        toolName: "test_tool",
        sources: testSource,
      });

      expect(TOOL_MEMORY[chatId]["test_tool"].usedSources).toContainEqual(
        testSource
      );
    });

    test("should add artifacts to tool memory", () => {
      const chatId = "test_chat";
      const testArtifact: ArtifactReturn = {
        type: "image",
        url: "https://example.com/image.jpg",
        label: "test",
      };

      addEntryToToolMemory(chatId, {
        toolName: "test_tool",
        artifacts: testArtifact,
      });

      expect(TOOL_MEMORY[chatId]["test_tool"].usedArtifacts).toContainEqual(
        testArtifact
      );
    });

    test("should get tool memory", () => {
      const chatId = "test_chat";
      const testSource: SourceReturn = {
        type: "url",
        label: "test",
        url: "https://example.com",
      };
      const testArtifact: ArtifactReturn = {
        type: "image",
        url: "https://example.com/image.jpg",
        label: "test",
      };

      addEntryToToolMemory(chatId, {
        toolName: "test_tool",
        sources: testSource,
        artifacts: testArtifact,
      });

      const memory = getToolMemory(chatId);
      expect(memory["test_tool"].usedSources).toContainEqual(testSource);
      expect(memory["test_tool"].usedArtifacts).toContainEqual(testArtifact);
    });
  });
});
