import type { SourceReturn, ToolContext } from "../../ai-sdk/types";
import { nanoid } from "nanoid";
import { tool, jsonSchema } from "ai";
import { addEntryToToolMemory } from "../tools";
import log from "../../../log";
import {
  getAiProviderModelByProviderAndModel,
  splitModelString,
} from "../../models";
import { getNearestEmbeddings } from "../../knowledge/similarity-search";
import {
  getKnowledgeEntries,
  extendKnowledgeEntriesWithTextChunks,
} from "../../knowledge/get-knowledge";
import { generateDocumentSummary } from "../../summary";

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
  // AI model
  model?: string;
  // User context for execution
  getUserContext: () => ToolContext;
}

interface QueryParams {
  query: string;
}

// Helper to estimate token count from string length
function estimateTokens(strLength: number): number {
  // OpenAI: ~4 chars per token
  return Math.ceil(strLength / 4);
}

/**
 * Creates a dynamic knowledge base tool with pre-selected filters.
 *
 * Adaptive logic for knowledge retrieval:
 * 1. Uses semantic search (getNearestEmbeddings) to find relevant chunks for the query.
 * 2. Groups the results by knowledgeEntryId (i.e., by document).
 * 3. For each relevant knowledge entry:
 *    a. Estimates the token count for the full document using meta.textLength (approx. 4 chars per token).
 *    b. If the full document fits into the available model context (based on modelConfig.maxTokens and maxOutputTokens),
 *       loads and returns the entire document (all chunks in order).
 *    c. If not, checks if the sum of the relevant chunks fits into the context and returns only those chunks.
 *    d. If even the relevant chunks are too large, includes only the single most relevant chunk (which always fits).
 * 4. The process is greedy: it fills the context with as much relevant content as possible, preferring full documents, then chunks, then a single chunk.
 * 5. All sources (full, chunk) are tracked and added to the tool memory for traceability.
 * 6. The tool supports a 'mode' parameter ("auto" | "chunks" | "full") for future extension, but defaults to "auto" (adaptive).
 *
 * This approach maximizes the amount of relevant knowledge provided to the LLM while respecting the model's token limits.
 *
 * @param params Tool configuration and filter options
 * @returns An object with the tool name and the tool instance
 */
export async function createDynamicKnowledgeBaseTool(
  params: DynamicKnowledgeBaseParams
) {
  const toolId = nanoid(8);
  const baseName = params.baseName || "query-knowledge-base";
  const toolName = `${baseName}_${toolId}`;

  const modelString =
    params.model ||
    (process.env.DEFAULT_CHAT_COMPLETION_MODEL ?? "openai:gpt-4o-mini");
  const { provider, model } = splitModelString(modelString);

  const modelConfig = await getAiProviderModelByProviderAndModel(
    params.getUserContext().organisationId,
    provider,
    model
  );

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
      const userContext = params.getUserContext();
      if (!userContext?.organisationId) {
        log.error("Missing organisationId in user context");
        return "Missing organisationId in user context";
      }

      // Allow for future extension: mode (auto/chunks/full)
      const mode = (params as any).mode || "auto";

      try {
        const { n = 3, addBeforeN = 0, addAfterN = 0 } = params;
        // Get model token budget
        const maxTokens = modelConfig.maxTokens || 4096;
        const maxOutputTokens = modelConfig.maxOutputTokens || 512;
        // Reserve 10% for prompt overhead
        const availableContextTokens = Math.floor(
          (maxTokens - maxOutputTokens) * 0.9
        );

        // Step 1: Get relevant chunks
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

        if (results.length === 0) {
          return "No relevant knowledge chunks found.";
        }

        // Step 2: Group chunks by knowledgeEntryId
        const chunksByEntry: Record<string, typeof results> = {};
        for (const chunk of results) {
          if (!chunksByEntry[chunk.knowledgeEntryId]) {
            chunksByEntry[chunk.knowledgeEntryId] = [];
          }
          chunksByEntry[chunk.knowledgeEntryId].push(chunk);
        }

        // Step 3: Fetch meta.textLength for each entry
        const entryIds = Object.keys(chunksByEntry);
        // Use getKnowledgeEntries to get meta for each entry
        const entries = await getKnowledgeEntries({
          organisationId: userContext.organisationId,
          userId: userContext.userId,
          ids: entryIds,
        });

        // Step 4: Decide for each entry: full doc, chunks, or single chunk
        let usedTokens = 0;
        const outputs: string[] = [];
        const sources: SourceReturn[] = [];

        for (const entry of entries) {
          const entryChunks = chunksByEntry[entry.id] || [];
          const entryName = entry.name;
          const entryMeta = entry.meta || {};
          const textLength = entryMeta.textLength || 0;
          const entryTokens = estimateTokens(textLength);

          // Try to fit full document if possible
          if (
            mode === "full" ||
            (mode === "auto" &&
              entryTokens + usedTokens <= availableContextTokens)
          ) {
            // Fetch all chunks for this entry
            const [fullEntry] = await extendKnowledgeEntriesWithTextChunks([
              entry,
            ]);
            if (fullEntry) {
              const text = fullEntry.fullText;
              const tokens = estimateTokens(text.length);
              if (tokens + usedTokens <= availableContextTokens) {
                outputs.push(
                  `KnowledgeEntry [\"${entryName}\", ${entry.id}]:\n${text}`
                );
                usedTokens += tokens;
                sources.push({
                  type: "knowledge-entry",
                  label: `[Full] ${entryName}`,
                  id: entry.id,
                  external: false,
                });
                continue;
              }
            }
          }

          // Fallback: Only relevant chunks
          const chunkText = entryChunks.map((c) => c.text).join("\n");
          const chunkTokens = estimateTokens(chunkText.length);
          if (
            mode === "chunks" ||
            (mode === "auto" &&
              chunkTokens + usedTokens <= availableContextTokens)
          ) {
            outputs.push(
              `KnowledgeEntry [\"${entryName}\", ${entry.id}]:\n${chunkText}`
            );
            usedTokens += chunkTokens;
            for (const c of entryChunks) {
              sources.push({
                type: "knowledge-chunk",
                label: `[Chunk] ${entryName}`,
                id: c.id,
                external: false,
              });
            }
            continue;
          }

          // Fallback: Only the single most relevant chunk (always fits)
          if (entryChunks.length > 0) {
            const c = entryChunks[0];
            outputs.push(
              `KnowledgeEntry [\"${entryName}\", ${entry.id}]:\n${c.text}`
            );
            usedTokens += estimateTokens(c.text.length);
            sources.push({
              type: "knowledge-chunk",
              label: `[Chunk] ${entryName}`,
              id: c.id,
              external: false,
            });
          }
        }

        // Add sources to tool memory
        addEntryToToolMemory(userContext.chatId, {
          toolName,
          sources,
        });

        return outputs.join("\n\n");
      } catch (error: any) {
        log.error("Error querying knowledge base", error);
        return "Error querying knowledge base: " + error.message;
      }
    },
  });

  return {
    name: toolName,
    tool: t,
  };
}
