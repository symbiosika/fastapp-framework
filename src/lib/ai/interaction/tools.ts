import { type Tool } from "ai";
import type {
  ArtifactInput,
  ArtifactReturn,
  SourceReturn,
  ToolContext,
  ToolReturn,
} from "../ai-sdk/types";
import {
  getWebhookToolsForOrganisation,
  getWebhookToolsForUser,
} from "../../webhooks/tools";

/*
Tool Registry and Tool Memory

Base Tools are registered in the app globally.
To give each Tool the possibility to store items it the memory 
it must run in User Context.

So it is required to register each Tool as a Dynamic Tool for each chat.
And drop it after that.
*/

type ToolMetadata = {
  name: string;
  label: string;
  description: string;
};

type BaseToolRegistryEntry = {
  toolFactory: (context: ToolContext) => ToolReturn;
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
  inputArtifacts?: ArtifactInput[];
};

type ChatToolMemory = {
  [toolName: string]: ToolMemoryEntries;
};

type GlobalToolMemory = {
  [chatId: string]: ChatToolMemory;
};

type ChatShortTermMemoryArtifact = {
  type: "image";
  file: File;
};

type ChatShortTermMemory = {
  [chatId: string]: {
    inputArtifacts?: ChatShortTermMemoryArtifact[];
  };
};

/**
 * Short Term Memory for all chats
 */
export const SHORT_TERM_MEMORY: ChatShortTermMemory = {};

/**
 * The Memory for all tools
 */
export const TOOL_MEMORY: GlobalToolMemory = {};

/**
 * A registry for static tools factory functions
 */
export const BASE_TOOL_REGISTRY: Record<
  string, // is the tool-name
  BaseToolRegistryEntry
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
export const addBaseTool = (
  name: string,
  label: string,
  description: string,
  toolFactory: (context: ToolContext) => ToolReturn
): void => {
  BASE_TOOL_REGISTRY[name] = {
    meta: {
      name,
      label,
      description,
    },
    toolFactory,
  };
};

/**
 * Add a dynamic tool to the registry
 */
export const addRuntimeTool = (
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
 * Add a dynamic tool to the registry by the name of the base-tool
 * Will lookup in the base-tool-registry and call the factory function
 * and register the result as a dynamic tool
 */
export const addRuntimeToolFromBaseRegistry = (
  name: string,
  context: ToolContext
): void => {
  const tool = BASE_TOOL_REGISTRY[name];
  if (!tool) {
    return;
  }
  const toolReturn = tool.toolFactory(context);
  addRuntimeTool(context.chatId, toolReturn.name, toolReturn.tool);
};

/**
 * Remove a static tool from the registry
 */
export const removeBaseTool = (name: string): void => {
  delete BASE_TOOL_REGISTRY[name];
};

/**
 * Remove a dynamic tool from the registry
 */
export const removeRuntimeTool = (chatId: string, name: string): void => {
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
      removeRuntimeTool(chatId, toolName);
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
  return Object.values(BASE_TOOL_REGISTRY).map((entry) => entry.meta);
};

/**
 * Get all static tools for an user. For UI Display
 * That will be user-specific webhook tools, organisation-specific webhook tools and app-tools
 */
export const getStaticToolOverviewForMyUser = async (
  userId: string,
  organisationId: string
): Promise<ToolMetadata[]> => {
  const allTools: ToolMetadata[] = [];

  const staticAppTools = getStaticToolOverview();
  allTools.push(...staticAppTools);

  const staticWebhookTools =
    await getWebhookToolsForOrganisation(organisationId);
  staticWebhookTools.map((tool) => {
    allTools.push({
      name: "webhook-" + tool.name,
      label: tool.meta.name ?? tool.name,
      description: tool.meta.description,
    });
  });

  const userWebhookTools = await getWebhookToolsForUser(userId, organisationId);
  userWebhookTools.map((tool) => {
    allTools.push({
      name: "webhook-" + tool.name,
      label: tool.meta.name ?? tool.name,
      description: tool.meta.description,
    });
  });

  return allTools;
};

/**
 * Get all tools for a chat ID. To Use in AI SDK
 * Returns <tool-name, tool>
 */
export const getRuntimeToolsDictionary = (
  chatId: string | undefined
): Record<string, Tool> | undefined => {
  if (!chatId) return {};

  // Add dynamic tools
  const registry = DYNAMIC_TOOL_REGISTRY[chatId];

  if (!registry) return undefined;

  const tools: Record<string, Tool> = {};
  Object.keys(registry).forEach((toolName) => {
    tools[toolName] = registry[toolName].tool;
  });
  return tools;
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
    inputArtifacts?: ArtifactInput[] | ArtifactInput;
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

/**
 * Get the short term memory for a chat ID
 */
export const getShortTermMemory = (
  chatId: string | undefined
): { inputArtifacts?: ChatShortTermMemoryArtifact[] } => {
  if (!chatId) return {};
  return SHORT_TERM_MEMORY[chatId] ?? {};
};

/**
 * Add an entry to the short term memory
 */
export const addEntryToShortTermMemory = (
  chatId: string,
  data: {
    inputArtifacts?: ChatShortTermMemoryArtifact[];
  }
): void => {
  if (!chatId) return;

  if (!SHORT_TERM_MEMORY[chatId]) {
    SHORT_TERM_MEMORY[chatId] = {};
  }

  SHORT_TERM_MEMORY[chatId].inputArtifacts = data.inputArtifacts;
};

/**
 * Delete the short term memory for a chat ID
 */
export const deleteShortTermMemory = (chatId: string): void => {
  delete SHORT_TERM_MEMORY[chatId];
};
