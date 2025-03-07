import { describe, it, expect, beforeAll } from "bun:test";
import { extractKnowledgeFromExistingDbEntry } from "../knowledge/add-knowledge";
import { getPlainKnowledge } from "../knowledge/get-knowledge";
import { createKnowledgeText } from "./knowledge-texts";
import { initTests } from "../../../test/init.test";
import { TEST_ORGANISATION_1 } from "../../../test/init.test";

describe("Knowledge Text Flow", () => {
  beforeAll(async () => {
    await initTests();
  });

  it("should create knowledge text and extract knowledge with filters", async () => {
    // 1. Add plain text to knowledge_text table
    const testText =
      "This is a test document for knowledge extraction testing.";
    const knowledgeText = await createKnowledgeText({
      text: testText,
      title: "Test Document",
      organisationId: TEST_ORGANISATION_1.id,
    });
    expect(knowledgeText.id).toBeDefined();

    // 2. Extract knowledge with filters
    const result = await extractKnowledgeFromExistingDbEntry({
      organisationId: TEST_ORGANISATION_1.id,
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
      userId: TEST_ORGANISATION_1.id,
      organisationId: TEST_ORGANISATION_1.id,
    });
    expect(foundKnowledge).toBeDefined();
    expect(foundKnowledge.length).toBeGreaterThan(0);

    // Clean up (you might want to add cleanup functions)
    // await cleanupTestData(knowledgeText.id, result.id);
  });
});
