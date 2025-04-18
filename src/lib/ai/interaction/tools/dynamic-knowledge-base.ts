import type { ToolContext } from "../../ai-sdk/types";
import { nanoid } from "nanoid";
import { tool, jsonSchema } from "ai";
import { addEntryToToolMemory } from "../tools";

interface DynamicKnowledgeBaseParams {
  // Pre-selected filters
  knowledgeEntryIds?: string[];
  knowledgeGroupIds?: string[];
  knowledgeFilterIds?: string[];
  // Optional description
  customDescription?: string;
  // Optional name (without ID-suffix)
  baseName?: string;
  // Parameters
  addBeforeN?: number;
  addAfterN?: number;
  n?: number;
  // User context for execution
  getUserContext: () => ToolContext;
}

interface QueryParams {
  query: string;
}

/**
 * Creates a dynamic knowledge base tool with pre-selected filters
 * The tool ID is used as a unique name to create multiple tools with
 * different filter configurations
 */
export function createDynamicKnowledgeBaseTool(
  params: DynamicKnowledgeBaseParams
) {
  const toolId = nanoid(8);
  const baseName = params.baseName || "queryKnowledgeBase";
  const toolName = `${baseName}_${toolId}`;

  const description =
    params.customDescription ||
    `Searches the knowledge base with pre-selected filters. ${
      params.knowledgeEntryIds?.length ? `Restricted to specific entries.` : ""
    } ${
      params.knowledgeGroupIds?.length ? `Restricted to specific groups.` : ""
    } ${params.knowledgeFilterIds?.length ? `Uses specific filters.` : ""}`;

  const t = tool({
    description,
    parameters: jsonSchema<QueryParams>({
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant information",
        },
      },
      required: ["query"],
    }),
    execute: async (args, options) => {
      console.log("-----------------");
      console.log("Hey. I'm a dynamic tool.");
      console.log("args", args);
      console.log("options", options);
      console.log("-----------------");

      const { query } = args as QueryParams;
      // Get user context from the provided function
      const userContext = params.getUserContext();
      if (!userContext?.organisationId) {
        throw new Error("Missing organisationId in user context");
      }

      try {
        // Import getNearestEmbeddings from the original tool
        const { getNearestEmbeddings } = await import(
          "../../knowledge/similarity-search"
        );

        // Combine parameters with pre-selected filters
        const { n = 3, addBeforeN = 0, addAfterN = 0 } = params;

        // Get results with pre-selected filters
        const results = await getNearestEmbeddings({
          organisationId: userContext.organisationId,
          searchText: query,
          n,
          addBeforeN,
          addAfterN,
          filterKnowledgeEntryIds: params.knowledgeEntryIds,
          filterKnowledgeGroupIds: params.knowledgeGroupIds,
          filterKnowledgeFilterIds: params.knowledgeFilterIds,
        });

        // Add these chunks to the tool memory
        addEntryToToolMemory(userContext.chatId, {
          toolName,
          sources: results.map((chunk) => ({
            type: "knowledge-chunk",
            label: `[Chunk] ${chunk.knowledgeEntryName}`,
            id: chunk.id,
            external: false,
            // url: chunk.url,
          })),
        });

        // Format results
        if (results.length === 0) {
          return "No relevant knowledge chunks found.";
        }

        const formattedResults = results
          .map((chunk) => {
            return `KnowledgeEntry ["${chunk.knowledgeEntryName}", ${chunk.knowledgeEntryId}]:\n${chunk.text}`;
          })
          .join("\n\n");

        return formattedResults;
      } catch (error: any) {
        throw new Error(`Error querying knowledge base: ${error.message}`);
      }
    },
  });

  return {
    name: toolName,
    tool: t,
  };
}
