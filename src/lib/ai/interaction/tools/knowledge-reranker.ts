import type { ToolContext } from "../../ai-sdk/types";
import { nanoid } from "nanoid";
import { tool, jsonSchema } from "ai";
import { getKnowledgeEntries } from "../../knowledge/get-knowledge";
import { chatCompletionWithObjectOutput } from "../../ai-sdk/generate-object";
import type { CoreMessage } from "ai";

const BASE_NAME = "rerankKnowledge";

interface KnowledgeRerankerParams {
  // List of IDs to consider
  knowledgeEntryIds?: string[];
  knowledgeGroupIds?: string[];
  knowledgeFilterIds?: string[];
  // User context for execution
  getUserContext: () => ToolContext;
}

interface QueryParams {
  query: string;
}

// Schema for the AI response, containing relevant knowledge entry IDs
const relevantEntriesSchema = jsonSchema<{
  relevantEntryIds: string[];
}>({
  type: "object",
  properties: {
    relevantEntryIds: {
      type: "array",
      items: {
        type: "string",
        description: "The ID of a relevant knowledge entry.",
      },
      description:
        "An array of IDs for the knowledge entries deemed relevant to the user query.",
    },
  },
  required: ["relevantEntryIds"],
});

/**
 * Creates a dynamic knowledge reranker tool.
 * This tool fetches specified knowledge entries, extracts their abstracts,
 * and uses an AI model to determine which entries are most relevant to the user's query.
 */
export function createKnowledgeRerankerTool(params: KnowledgeRerankerParams) {
  const toolId = nanoid(8);
  const toolName = `${BASE_NAME}_${toolId}`;

  const description = `Analyzes abstracts of pre-selected knowledge entries to find those most relevant to the user query. ${
    params.knowledgeEntryIds?.length ? `Considers specific entries.` : ""
  } ${
    params.knowledgeGroupIds?.length ? `Considers specific groups.` : ""
  } ${params.knowledgeFilterIds?.length ? `Considers specific filters.` : ""}`; // Filters aren't directly used for fetching here, but indicate context

  const t = tool({
    description,
    parameters: jsonSchema<QueryParams>({
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The user query to evaluate relevance against.",
        },
      },
      required: ["query"],
    }),
    execute: async (args) => {
      const { query } = args as QueryParams;
      const userContext = params.getUserContext();
      if (!userContext?.organisationId || !userContext?.userId) {
        throw new Error("Missing organisationId or userId in user context");
      }

      try {
        // 1. Fetch Knowledge Entries based on provided IDs
        // We primarily use knowledgeEntryIds if available.
        // Group/Filter IDs might require more complex logic to fetch associated entries,
        // For simplicity, we'll start with entry IDs.
        // TODO: Implement fetching logic based on Group/Filter IDs if needed.
        const entryIdsToFetch = params.knowledgeEntryIds || [];
        // Add logic here to fetch entry IDs based on group/filter IDs if needed
        // const groupBasedEntryIds = await getEntryIdsForGroups(params.knowledgeGroupIds);
        // const filterBasedEntryIds = await getEntryIdsForFilters(params.knowledgeFilterIds);
        // entryIdsToFetch.push(...groupBasedEntryIds, ...filterBasedEntryIds);
        // Remove duplicates:
        // const uniqueEntryIds = [...new Set(entryIdsToFetch)];

        if (entryIdsToFetch.length === 0) {
          return "No specific knowledge entries provided to rerank.";
        }

        const entries = await getKnowledgeEntries({
          organisationId: userContext.organisationId,
          userId: userContext.userId,
          ids: entryIdsToFetch, // Fetch only the specified entries
          limit: entryIdsToFetch.length, // Ensure all specified entries are fetched
        });

        if (!entries || entries.length === 0) {
          return "Could not find the specified knowledge entries.";
        }

        // 2. Prepare data for AI analysis (Abstracts/Descriptions)
        const entrySummaries = entries.map((entry) => ({
          id: entry.id,
          // Use abstract if available, otherwise fallback to description, or name as last resort
          summary: entry.description || entry.abstract || entry.name,
        }));

        if (entrySummaries.length === 0) {
          return "No summaries found for the specified knowledge entries.";
        }

        // 3. Use AI to determine relevant entries
        const systemPrompt = `You are an AI assistant tasked with identifying relevant knowledge base entries based on their summaries and a user query.
Analyze the following knowledge entry summaries and determine which ones are most relevant to the user's query.
Return ONLY the IDs of the relevant entries in the specified JSON format.`;

        const userPromptContent = `User Query: "${query}"
Knowledge Entry Summaries:
${entrySummaries
  .map((e, index) => `${index + 1}. ID: ${e.id}\n   Summary: ${e.summary}`)
  .join("\n\n")}

Based on the user query, which of the above knowledge entries are relevant?`;

        const messages: CoreMessage[] = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPromptContent },
        ];

        const result = await chatCompletionWithObjectOutput(
          messages,
          userContext,
          {
            schema: relevantEntriesSchema,
            // Consider adjusting temperature if needed
          }
        );

        // 4. Return the array of relevant IDs
        const responseObject = result.object as { relevantEntryIds: string[] };
        if (!responseObject || !responseObject.relevantEntryIds) {
          throw new Error(
            "AI failed to return relevant entry IDs in the expected format."
          );
        }

        return responseObject.relevantEntryIds;
      } catch (error: any) {
        console.error(
          `Error reranking knowledge base entries: ${error.message}`
        );
        // Return the error message or a user-friendly message
        return `Error during knowledge reranking: ${error.message}`;
        // Or potentially return an empty array if preferred on error:
        // return [];
      }
    },
  });

  return {
    name: toolName,
    tool: t,
  };
}
