import { Tool } from "ai";
import { getNearestEmbeddings } from "../../knowledge/similarity-search";

// Knowledge base tool implementation
export const queryKnowledgeBaseTool: Tool = {
  description:
    "Query the knowledge base for relevant information. This tool uses semantic similarity search (via getNearestEmbeddings) to retrieve relevant document chunks based on the user's query. Optionally, it can be filtered dynamically with associated knowledge entry or group IDs.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "The search query to find relevant information from the knowledge base",
      },
      n: {
        type: "number",
        description: "Number of nearest embeddings to retrieve",
        default: 5,
      },
      addBeforeN: {
        type: "number",
        description:
          "Number of additional chunks before the found chunk to retrieve",
        default: 0,
      },
      addAfterN: {
        type: "number",
        description:
          "Number of additional chunks after the found chunk to retrieve",
        default: 0,
      },
      knowledgeEntryIds: {
        type: "array",
        items: { type: "string" },
        description:
          "Optional list of knowledge entry IDs to filter the search results",
      },
      knowledgeGroupIds: {
        type: "array",
        items: { type: "string" },
        description:
          "Optional list of knowledge group IDs to filter the search results",
      },
      knowledgeFilterIds: {
        type: "array",
        items: { type: "string" },
        description:
          "Optional list of knowledge filter IDs to filter the search results",
      },
    },
    required: ["query"],
  },
  execute: async (params, context) => {
    // Ensure the organisationId is present in the user context
    if (!context.organisationId) {
      throw new Error("Missing organisationId in user context");
    }

    // Destructure the parameters with sensible defaults
    const {
      query,
      n = 5,
      addBeforeN = 0,
      addAfterN = 0,
      knowledgeEntryIds,
      knowledgeGroupIds,
      knowledgeFilterIds,
    } = params;

    try {
      // Call the getNearestEmbeddings function, which is defined in similarity-search.ts
      const results = await getNearestEmbeddings({
        organisationId: context.organisationId,
        searchText: query,
        n,
        addBeforeN,
        addAfterN,
        filterKnowledgeEntryIds: knowledgeEntryIds,
        filterKnowledgeGroupIds: knowledgeGroupIds,
        filterKnowledgeFilterIds: knowledgeFilterIds,
      });

      // Professional formatting of results
      if (results.length === 0) {
        return "No relevant knowledge chunks found.";
      }

      const formattedResults = results
        .map((chunk) => {
          return `Entry: ${chunk.knowledgeEntryName} (ID: ${chunk.knowledgeEntryId})
  Chunk ID: ${chunk.id}
  Extract: ${chunk.text.slice(0, 100)}...`;
        })
        .join("\n\n");

      return formattedResults;
    } catch (error: any) {
      throw new Error(`Error querying knowledge base: ${error.message}`);
    }
  },
};
