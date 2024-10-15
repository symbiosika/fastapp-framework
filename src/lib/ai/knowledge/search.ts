import type { AskKnowledgeInput } from "src/routes/ai";
import { textGenerationByPromptTemplate } from "../generation";
import { getNearestEmbeddings } from "./similarity-search";
import log from "src/lib/log";

/**
 * Get an answer to a question from the knowledge base.
 */
export const askKnowledge = async (data: AskKnowledgeInput) => {
    log.debug("askKnowledge", JSON.stringify(data));
    const chunks = await getNearestEmbeddings(data.question, data.countChunks, data.addBeforeN, data.addAfterN, data.filterKnowledgeEntryIds);
    log.debug(`Found ${chunks.length} chunks`);
    
    const r = await textGenerationByPromptTemplate({
        promptName: "answer-knowledge-question",
        promptCategory: "knowledge",
        usersPlaceholders: {
            knowledge_base: chunks.map(c => c.text).join("\n\n"),
            question: data.question
        }
    })

    return {
        answer: r,
        chunks: chunks
    }
}
