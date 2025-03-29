import { UserContext } from "../ai-sdk/types";

export type Tool = {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  execute: (params: any, context: UserContext) => Promise<any>;
};

// Knowledge base tool implementation
export const knowledgeBaseTool: Tool = {
  name: "queryKnowledgeBase",
  description: "Query the knowledge base for relevant information",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query to find relevant information",
      },
    },
    required: ["query"],
  },
  execute: async (params, context) => {
    // Placeholder - you'll implement the actual knowledge base query here
    return `This is information from the knowledge base about: ${params.query}`;
  },
};

// Function to convert tools to the format expected by the AI SDK
export function prepareToolsForAI(enabledTools: string[]) {
  return enabledTools
    .filter((toolName) => toolRegistry[toolName])
    .map((toolName) => {
      const tool = toolRegistry[toolName];
      return {
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      };
    });
}

// Execute a tool call
export async function executeToolCall(
  toolName: string,
  params: any,
  context: UserContext
) {
  const tool = Object.values(toolRegistry).find((t) => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  return await tool.execute(params, context);
}

// Tool registry
export const toolRegistry: Record<string, Tool> = {
  knowledge: knowledgeBaseTool,
  // Add more tools here as needed
};
