import { type Tool } from "ai";
import { queryKnowledgeBaseTool } from "./tools/query-knowledge-base-rag";
import type { SourceReturn } from "../ai-sdk";

// Execute a tool call
export async function executeToolCall(
  toolName: string,
  args: any,
  options: any
) {
  // Suche zuerst in statischen Tools, dann in dynamischen
  const tool = toolRegistry[toolName];

  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  return await tool.execute!(args, options);
}

// Tool registry
export const toolRegistry: Record<string, Tool> = {
  "query-knowledge-base-rag": queryKnowledgeBaseTool,
  // More tools can be registered here.
};

// Erweitert um Unterstützung für dynamisch erzeugte Tools
export const dynamicToolsRegistry: Record<
  string,
  {
    registeredAt: Date;
    memory?: {
      usedSources?: SourceReturn[];
    };
  }
> = {};

export const addTool = (name: string, tool: Tool) => {
  toolRegistry[name] = tool;
};

export const addDynamicTool = (name: string, tool: Tool) => {
  toolRegistry[name] = tool;
  dynamicToolsRegistry[name] = {
    registeredAt: new Date(),
  };
};

export const addKnowledgeSourceToDynamicToolMemory = (
  name: string,
  source: SourceReturn[] | SourceReturn
) => {
  if (!dynamicToolsRegistry[name]) {
    return;
  }
  if (
    !dynamicToolsRegistry[name].memory ||
    !dynamicToolsRegistry[name].memory.usedSources
  ) {
    dynamicToolsRegistry[name].memory = {
      usedSources: [],
    };
  }
  if (Array.isArray(source)) {
    dynamicToolsRegistry[name].memory.usedSources?.push(...source);
  } else {
    dynamicToolsRegistry[name].memory.usedSources?.push(source);
  }
};

export const getDynamicToolMemory = (name: string) => {
  return dynamicToolsRegistry[name]?.memory;
};

export const removeTool = (name: string) => {
  delete toolRegistry[name];
};

export const removeDynamicTool = (name: string) => {
  delete dynamicToolsRegistry[name];
};

export const cleanupDynamicTools = () => {
  const now = new Date();
  const toolsToRemove = Object.keys(dynamicToolsRegistry).filter(
    (toolName) =>
      now.getTime() - dynamicToolsRegistry[toolName].registeredAt.getTime() >
      1000 * 60 * 60 // 1 hour
  );
  toolsToRemove.forEach((toolName) => {
    removeDynamicTool(toolName);
  });
};

export const registerCleanUpJob = () => {
  setInterval(cleanupDynamicTools, 1000 * 60 * 60); // 1 hour
};

export const getToolsDictionary = (filter: string[] = []) => {
  if (filter.length === 0) return {};

  const filteredTools: Record<string, Tool> = {};

  Object.keys(toolRegistry).forEach((toolName) => {
    if (filter.length === 0 || filter.includes(toolName)) {
      filteredTools[toolName] = toolRegistry[toolName];
    }
  });

  return filteredTools;
};
