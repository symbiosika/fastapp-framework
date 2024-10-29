import type { AskKnowledgeInput } from "../../../routes/ai";
import { textGenerationByPromptTemplate } from "../generation";
import { getNearestEmbeddings } from "./similarity-search";
import log from "../../../lib/log";

/**
 * Get an answer to a question from the knowledge base.
 */
export const askKnowledge = async (data: AskKnowledgeInput) => {
  log.debug("askKnowledge", JSON.stringify(data));
  const chunks = await getNearestEmbeddings({
    searchText: data.question,
    n: data.countChunks,
    addBeforeN: data.addBeforeN,
    addAfterN: data.addAfterN,
    filterKnowledgeEntryIds: data.filterKnowledgeEntryIds,
  });
  log.debug(`Found ${chunks.length} chunks`);

  const r = await textGenerationByPromptTemplate({
    promptName: "answer-knowledge-question",
    promptCategory: "knowledge-consumer",
    usersPlaceholders: {
      knowledge_base: chunks.map((c) => c.text).join("\n\n"),
      question: data.question,
    },
  });

  const answer = r.responses[r.lastOutputVarName];

  return {
    answer,
    chunks,
  };
};
