import { addDynamicTool } from "./tools";
import { createDynamicKnowledgeBaseTool } from "./tools/dynamic-knowledge-base";

export const checkAndRegisterDynamicTool = async (query: {
  knowledgeEntries?: { id: string }[];
  knowledgeFilters?: { id: string }[];
  knowledgeGroups?: { id: string }[];
}) => {
  if (
    query.knowledgeEntries?.length ||
    query.knowledgeFilters?.length ||
    query.knowledgeGroups?.length
  ) {
    const tool = createDynamicKnowledgeBaseTool({
      knowledgeEntryIds: query.knowledgeEntries?.map((entry) => entry.id),
      knowledgeFilterIds: query.knowledgeFilters?.map((filter) => filter.id),
      knowledgeGroupIds: query.knowledgeGroups?.map((group) => group.id),
    });

    addDynamicTool(tool);

    return tool;
  }
};
