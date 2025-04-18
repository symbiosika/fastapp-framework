import type { ToolContext } from "../ai-sdk/types";
import { addDynamicTool } from "./tools";
import { createDynamicKnowledgeBaseTool } from "./tools/dynamic-knowledge-base";

// Define the interface here instead of importing it
interface KnowledgeQuery {
  knowledgeEntries?: { id: string; label: string }[];
  knowledgeFilters?: { id: string; label: string }[];
  knowledgeGroups?: { id: string; label: string }[];
}

// Define the tool return type to avoid dependency on internal types
interface DynamicTool {
  name: string;
  tool: any;
}

export const checkAndRegisterDynamicTool = async (
  query: KnowledgeQuery,
  type: "rag",
  context: ToolContext
): Promise<DynamicTool | undefined> => {
  // Skip if no knowledge filters are selected
  if (
    !query.knowledgeEntries?.length &&
    !query.knowledgeFilters?.length &&
    !query.knowledgeGroups?.length
  ) {
    return undefined;
  }

  // Create the tool with explicit parameters
  const tool = createDynamicKnowledgeBaseTool({
    knowledgeEntryIds: query.knowledgeEntries?.map((entry) => entry.id) || [],
    knowledgeFilterIds:
      query.knowledgeFilters?.map((filter) => filter.id) || [],
    knowledgeGroupIds: query.knowledgeGroups?.map((group) => group.id) || [],
    getUserContext: () => context,
  });

  // Register the tool
  addDynamicTool(context.chatId, tool.name, tool.tool);

  return tool;
};
