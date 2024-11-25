import { describe, it, expect, beforeAll } from "bun:test";
import { addPlainKnowledgeText } from "../knowledge-texts";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../db/db-connection";
import { extractKnowledgeFromExistingDbEntry } from "../knowledge/add-knowledge";
import { getPlainKnowledge } from "../knowledge/get-knowledge";

describe("Knowledge Text Flow", () => {
  beforeAll(async () => {
    await createDatabaseClient();
    await waitForDbConnection();
  });

  it("should create knowledge text and extract knowledge with filters", async () => {
    // 1. Add plain text to knowledge_text table
    const testText =
      "This is a test document for knowledge extraction testing.";
    const knowledgeText = await addPlainKnowledgeText({
      text: testText,
      title: "Test Document",
    });
    expect(knowledgeText.id).toBeDefined();

    // 2. Extract knowledge with filters
    const result = await extractKnowledgeFromExistingDbEntry({
      sourceType: "text",
      sourceId: knowledgeText.id,
      filters: {
        "test-case": "test-1",
      },
    });
    expect(result.ok).toBe(true);
    expect(result.id).toBeDefined();

    // 3. Retrieve knowledge by filters
    const foundKnowledge = await getPlainKnowledge({
      filters: {
        "test-case": ["test-1"],
      },
    });
    expect(foundKnowledge).toBeDefined();
    expect(foundKnowledge.length).toBeGreaterThan(0);

    // Clean up (you might want to add cleanup functions)
    // await cleanupTestData(knowledgeText.id, result.id);
  });
});
