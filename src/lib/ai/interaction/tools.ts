import { type Tool } from "ai";
import type { ArtifactReturn, SourceReturn } from "../ai-sdk/types";

type ToolMetadata = {
  name: string;
  label: string;
  description: string;
};

type ToolRegistryEntry = {
  tool: Tool;
  meta: ToolMetadata;
};

type DynamicToolRegistryEntry = {
  registeredAt: Date;
  meta: ToolMetadata;
  tool: Tool;
};

type ToolMemoryEntries = {
  usedSources?: SourceReturn[];
  usedArtifacts?: ArtifactReturn[];
};

type ChatToolMemory = {
  [toolName: string]: ToolMemoryEntries;
};

type GlobalToolMemory = {
  [chatId: string]: ChatToolMemory;
};

/**
 * The Memory for all tools
 */
export const TOOL_MEMORY: GlobalToolMemory = {};

/**
 * A Tool registry for static tools
 */
export const STATIC_TOOL_REGISTRY: Record<
  string, // is the tool-name
  ToolRegistryEntry
> = {};

/**
 * A Tool registry for chat-specific tools with user context
 */
export const DYNAMIC_TOOL_REGISTRY: Record<
  string, // is the chat-ID!
  Record<string, DynamicToolRegistryEntry> // tool-name TO tool-entry
> = {};

/**
 * Add a static tool to the registry
 */
export const addStaticTool = (
  name: string,
  label: string,
  description: string,
  tool: Tool
): void => {
  STATIC_TOOL_REGISTRY[name] = {
    meta: {
      name,
      label,
      description,
    },
    tool,
  };
};

/**
 * Add a dynamic tool to the registry
 */
export const addDynamicTool = (
  chatId: string,
  name: string,
  tool: Tool
): void => {
  if (!DYNAMIC_TOOL_REGISTRY[chatId]) {
    DYNAMIC_TOOL_REGISTRY[chatId] = {};
  }

  DYNAMIC_TOOL_REGISTRY[chatId][name] = {
    registeredAt: new Date(),
    tool: tool,
    meta: {
      name,
      label: "",
      description: "",
    },
  };
};

/**
 * Remove a static tool from the registry
 */
export const removeStaticTool = (name: string): void => {
  delete STATIC_TOOL_REGISTRY[name];
};

/**
 * Remove a dynamic tool from the registry
 */
export const removeDynamicTool = (chatId: string, name: string): void => {
  delete DYNAMIC_TOOL_REGISTRY[chatId][name];
};

/**
 * Cleanup dynamic tools
 */
export const cleanupDynamicTools = (): void => {
  const now = new Date();

  // Iterate through each chat's tools
  Object.entries(DYNAMIC_TOOL_REGISTRY).forEach(([chatId, tools]) => {
    // Find tools that are older than 1 hour
    const toolsToRemove = Object.entries(tools).filter(
      ([_, entry]) =>
        now.getTime() - entry.registeredAt.getTime() > 1000 * 60 * 60 // 1 hour
    );

    // Remove each expired tool
    toolsToRemove.forEach(([toolName]) => {
      removeDynamicTool(chatId, toolName);
    });
  });
};

/**
 * Register a cleanup job for dynamic tools
 */
export const registerCleanUpJob = (): void => {
  setInterval(cleanupDynamicTools, 1000 * 60 * 60); // 1 hour
};

/**
 * Get all static tools. For UI Display
 */
export const getStaticToolOverview = (): ToolMetadata[] => {
  return Object.values(STATIC_TOOL_REGISTRY).map((entry) => entry.meta);
};

/**
 * Get all enabled tools. To Use in AI SDK
 * Returns <tool-name, tool>
 */
export const getEnabledTools = (
  filter: string[] = []
): Record<string, Tool> => {
  if (filter.length === 0) return {};

  const filteredTools: Record<string, Tool> = {};

  // Add static tools
  Object.keys(STATIC_TOOL_REGISTRY).forEach((toolName) => {
    if (filter.includes(toolName)) {
      filteredTools[toolName] = STATIC_TOOL_REGISTRY[toolName].tool;
    }
  });

  return filteredTools;
};

/**
 * Get all tools for a chat ID. To Use in AI SDK
 * Returns <tool-name, tool>
 */
export const getDynamicToolsForChatId = (
  chatId: string | undefined
): Record<string, Tool> => {
  if (!chatId) return {};

  // Add dynamic tools
  const registry = DYNAMIC_TOOL_REGISTRY[chatId];

  if (!registry) return {};

  const tools: Record<string, Tool> = {};
  Object.keys(registry).forEach((toolName) => {
    tools[toolName] = registry[toolName].tool;
  });
  return tools;
};

/**
 * Get all tools as Dict. To Use in AI SDK
 * Returns <tool-name, tool>
 */
export const getToolsDictionary = (
  chatId: string | undefined,
  filter: string[] = []
): Record<string, Tool> | undefined => {
  const tools = getDynamicToolsForChatId(chatId);
  const staticTools = getEnabledTools(filter);
  const allTools = { ...tools, ...staticTools };
  if (Object.keys(allTools).length === 0) return undefined;
  return allTools;
};

/**
 * Add an entry to the tool memory
 */
export const addEntryToToolMemory = (
  chatId: string,
  data: {
    toolName: string;
    sources?: SourceReturn[] | SourceReturn;
    artifacts?: ArtifactReturn[] | ArtifactReturn;
  }
): void => {
  if (!chatId || chatId === "") {
    throw new Error("Chat ID is required");
  }

  if (!data.toolName || data.toolName === "") {
    throw new Error("Tool name is required");
  }

  // Initialize chat memory if it doesn't exist
  if (!TOOL_MEMORY[chatId]) {
    TOOL_MEMORY[chatId] = {};
  }

  // Initialize tool memory if it doesn't exist
  if (!TOOL_MEMORY[chatId][data.toolName]) {
    TOOL_MEMORY[chatId][data.toolName] = {};
  }

  // Process sources
  if (data.sources) {
    const sources = Array.isArray(data.sources) ? data.sources : [data.sources];
    if (!TOOL_MEMORY[chatId][data.toolName].usedSources) {
      TOOL_MEMORY[chatId][data.toolName].usedSources = sources;
    } else {
      TOOL_MEMORY[chatId][data.toolName].usedSources = [
        ...TOOL_MEMORY[chatId][data.toolName].usedSources!,
        ...sources,
      ];
    }
  }

  // Process artifacts
  if (data.artifacts) {
    const artifacts = Array.isArray(data.artifacts)
      ? data.artifacts
      : [data.artifacts];
    if (!TOOL_MEMORY[chatId][data.toolName].usedArtifacts) {
      TOOL_MEMORY[chatId][data.toolName].usedArtifacts = artifacts;
    } else {
      TOOL_MEMORY[chatId][data.toolName].usedArtifacts = [
        ...TOOL_MEMORY[chatId][data.toolName].usedArtifacts!,
        ...artifacts,
      ];
    }
  }
};

/**
 * Get the tool memory for a chat ID
 */
export const getToolMemory = (chatId: string | undefined): ChatToolMemory => {
  if (!chatId) return {};
  return TOOL_MEMORY[chatId] ?? {};
};
