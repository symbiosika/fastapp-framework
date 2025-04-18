import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  STATIC_TOOL_REGISTRY,
  DYNAMIC_TOOL_REGISTRY,
  TOOL_MEMORY,
  addStaticTool,
  addDynamicTool,
  removeStaticTool,
  removeDynamicTool,
  cleanupDynamicTools,
  getEnabledTools,
  addEntryToToolMemory,
  getToolMemory,
} from "./tools";
import type { SourceReturn, ArtifactReturn } from "../ai-sdk/types";

describe("Tools Registry", () => {
  // Sample tool for testing
  const testTool = {
    name: "test_tool",
    description: "A test tool",
    parameters: {
      type: "object",
      properties: {},
    },
  };

  beforeAll(() => {
    // Clear registries before each test
    Object.keys(STATIC_TOOL_REGISTRY).forEach(
      (key) => delete STATIC_TOOL_REGISTRY[key]
    );
    Object.keys(DYNAMIC_TOOL_REGISTRY).forEach(
      (key) => delete DYNAMIC_TOOL_REGISTRY[key]
    );
    Object.keys(TOOL_MEMORY).forEach((key) => delete TOOL_MEMORY[key]);
  });

  describe("Static Tool Registry", () => {
    test("should add a static tool", () => {
      addStaticTool("test_tool", "Test Tool", "A test tool", testTool);
      expect(STATIC_TOOL_REGISTRY["test_tool"]).toBeDefined();
      expect(STATIC_TOOL_REGISTRY["test_tool"].tool).toEqual(testTool);
      expect(STATIC_TOOL_REGISTRY["test_tool"].meta).toEqual({
        name: "test_tool",
        label: "Test Tool",
        description: "A test tool",
      });
    });

    test("should remove a static tool", () => {
      addStaticTool("test_tool", "Test Tool", "A test tool", testTool);
      removeStaticTool("test_tool");
      expect(STATIC_TOOL_REGISTRY["test_tool"]).toBeUndefined();
    });
  });

  describe("Dynamic Tool Registry", () => {
    test("should add a dynamic tool", () => {
      const chatId = "test_chat";
      addDynamicTool(chatId, "test_tool", testTool);
      expect(DYNAMIC_TOOL_REGISTRY[chatId]["test_tool"]).toBeDefined();
      expect(DYNAMIC_TOOL_REGISTRY[chatId]["test_tool"].tool).toEqual(testTool);
      expect(
        DYNAMIC_TOOL_REGISTRY[chatId]["test_tool"].registeredAt
      ).toBeInstanceOf(Date);
    });

    test("should remove a dynamic tool", () => {
      const chatId = "test_chat";
      addDynamicTool(chatId, "test_tool", testTool);
      removeDynamicTool(chatId, "test_tool");
      expect(DYNAMIC_TOOL_REGISTRY[chatId]["test_tool"]).toBeUndefined();
    });

    test("should cleanup old dynamic tools", () => {
      const chatId = "test_chat";
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 2); // 2 hours old

      DYNAMIC_TOOL_REGISTRY[chatId] = {
        old_tool: {
          registeredAt: oldDate,
          tool: testTool,
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
    test("should return filtered tools", () => {
      addStaticTool("tool1", "Tool 1", "First tool", testTool);
      addStaticTool("tool2", "Tool 2", "Second tool", testTool);

      const filteredTools = getEnabledTools(["tool1", "tool2"]);
      expect(Object.keys(filteredTools)).toEqual(["tool1", "tool2"]);
    });

    test("should return empty dictionary for empty filter", () => {
      const filteredTools = getEnabledTools([]);
      expect(Object.keys(filteredTools)).toHaveLength(0);
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
