/**
 * Knowledge Testing
 */
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db/db-connection";
import {
  knowledgeEntry,
  knowledgeChunks,
  knowledgeGroup,
} from "../lib/db/schema/knowledge";
import { TEST_ORGANISATION_1, TEST_USER_1 } from "./init.test";
import fs from "fs";
import {
  promptTemplateKnowledgeEntries,
  promptTemplates,
} from "../lib/db/schema/prompts";
import {
  TEST_KNOWLEDGE_TEXT,
  TEST_KNOWLEDGE_TEXT_EMBEDDING,
} from "./knowledge-entries.test";

const pathToEmbeddingFile = __dirname + "/files/test-knowledge-embedding.json";

export const TEST_KNOWLEDGE_GROUP = {
  id: "11000000-1100-1100-1100-000000000000",
  name: "Test Knowledge Group",
  organisationId: TEST_ORGANISATION_1.id,
  userId: TEST_USER_1.id,
  organisationWideAccess: true,
};

export const TEST_KNOWLEDGE_ENTRY = {
  id: "00000000-1100-1100-1100-000000000000",
  knowledgeGroupId: TEST_KNOWLEDGE_GROUP.id,
  name: "Test Knowledge",
  organisationId: TEST_ORGANISATION_1.id,
  sourceType: "text" as const,
  versionText: TEST_KNOWLEDGE_TEXT,
};

export const TEST_KNOWLEDGE_PROMPT_TEMPLATE = {
  id: "00000000-1100-1100-1100-123000000000",
  organisationId: TEST_ORGANISATION_1.id,
  name: "test-knowledge-prompt-template",
  category: "test",
  description: "Test description",
  hidden: false,
  systemPrompt:
    "You are a helpful assistant and will answer questions about the knowledge base. If the knowledge cannot answer the question, you will say so!",
  userPrompt: null,
  langCode: "en",
  needsInitialCall: false,
  llmOptions: {},
};

export const importTestKnowledge = async () => {
  // Create a knowledge group for the knowledge entry
  await getDb()
    .insert(knowledgeGroup)
    .values(TEST_KNOWLEDGE_GROUP)
    .onConflictDoUpdate({
      target: [knowledgeGroup.id],
      set: TEST_KNOWLEDGE_GROUP,
    });

  const knowledge = await getDb()
    .insert(knowledgeEntry)
    .values(TEST_KNOWLEDGE_ENTRY)
    .onConflictDoUpdate({
      target: [knowledgeEntry.id],
      set: TEST_KNOWLEDGE_ENTRY,
    })
    .returning();

  // Create a prompt template for the knowledge entry
  await getDb()
    .insert(promptTemplates)
    .values(TEST_KNOWLEDGE_PROMPT_TEMPLATE)
    .onConflictDoUpdate({
      target: [promptTemplates.id],
      set: TEST_KNOWLEDGE_PROMPT_TEMPLATE,
    });

  // assign the prompt template to the knowledge entry
  await getDb()
    .insert(promptTemplateKnowledgeEntries)
    .values({
      promptTemplateId: TEST_KNOWLEDGE_PROMPT_TEMPLATE.id,
      knowledgeEntryId: knowledge[0].id,
    })
    .onConflictDoUpdate({
      target: [promptTemplateKnowledgeEntries.id],
      set: {
        promptTemplateId: TEST_KNOWLEDGE_PROMPT_TEMPLATE.id,
        knowledgeEntryId: knowledge[0].id,
      },
    });

  // Create a corresponding knowledge chunk with the same embedding
  await getDb().insert(knowledgeChunks).values({
    knowledgeEntryId: knowledge[0].id,
    text: TEST_KNOWLEDGE_TEXT,
    embeddingModel: TEST_KNOWLEDGE_TEXT_EMBEDDING.model,
    textEmbedding: TEST_KNOWLEDGE_TEXT_EMBEDDING.embedding,
    order: 0,
    createdAt: new Date().toISOString(),
  });

  return knowledge[0];
};

export const deleteTestKnowledge = async () => {
  await getDb()
    .delete(knowledgeEntry)
    .where(eq(knowledgeEntry.id, TEST_KNOWLEDGE_ENTRY.id));
};
