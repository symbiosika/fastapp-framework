import { describe, it, expect, beforeAll } from "bun:test";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../db/db-connection";
import { extractKnowledgeFromExistingDbEntry } from "../knowledge/add-knowledge";
import { getPlainKnowledge } from "../knowledge/get-knowledge";
import { initTestOrganisation } from "../../../test/init.test";
import { createKnowledgeText } from "./knowledge-texts";

describe("Knowledge Text Flow", () => {
  beforeAll(async () => {
    await createDatabaseClient();
    await waitForDbConnection();
    await initTestOrganisation();
  });

  it("should create knowledge text and extract knowledge with filters", async () => {
    // 1. Add plain text to knowledge_text table
    const testText =
      "This is a test document for knowledge extraction testing.";
    const knowledgeText = await createKnowledgeText({
      text: testText,
      title: "Test Document",
      organisationId: "00000000-1111-1111-1111-000000000000",
    });
    expect(knowledgeText.id).toBeDefined();

    // 2. Extract knowledge with filters
    const result = await extractKnowledgeFromExistingDbEntry({
      organisationId: "00000000-1111-1111-1111-000000000000",
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
      userId: "00000000-1111-1111-1111-000000000000",
      organisationId: "00000000-1111-1111-1111-000000000000",
    });
    expect(foundKnowledge).toBeDefined();
    expect(foundKnowledge.length).toBeGreaterThan(0);

    // Clean up (you might want to add cleanup functions)
    // await cleanupTestData(knowledgeText.id, result.id);
  });
});
