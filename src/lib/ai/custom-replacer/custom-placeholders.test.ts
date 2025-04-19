import { describe, test, expect, mock } from "bun:test";
import { customAppPlaceholders } from "./custom-placeholders"; // Assuming your placeholders are exported from here
import * as similaritySearch from "../knowledge/similarity-search"; // Import the module to mock
import type { ChatSessionContext } from "../chat-store";
import type { PlaceholderArgumentDict } from "./replacer";

// Mock the getNearestEmbeddings function
mock.module("../knowledge/similarity-search", () => ({
  getNearestEmbeddings: async (params: any) => {
    // Return a simple structure based on filters for verification
    return [
      {
        text: `Mock result for filters: ${JSON.stringify(params.filter)}`,
        knowledgeEntryId: "mock-entry-id",
        knowledgeEntryName: "mock-entry-name",
        id: "mock-chunk-id",
        meta: {},
      },
    ];
  },
}));

const mockContext: ChatSessionContext = {
  chatId: "testChatId",
  userId: "testUserId",
  organisationId: "testOrganisationId",
};

describe("customAppPlaceholders - similar_to", () => {
  const similarToParser = customAppPlaceholders.find(
    (p) => p.name === "similar_to"
  );

  if (!similarToParser) {
    throw new Error("similar_to parser not found");
  }

  test("should correctly parse filters with quoted keys and values", async () => {
    const match =
      "{{#similar_to search_for_variable=query filter:category='val1,val2' 'filter:category with space'='\"value 1\",\"value 2, ok\"'}}";
    const args: PlaceholderArgumentDict = {
      searchForVariable: "query",
      "filter:category": "val1,val2",
      "filter:category with space": '"value 1","value 2, ok"',
    };
    const variables = { query: "test query" };

    const result = await similarToParser.replacerFunction(
      match,
      args,
      variables,
      mockContext
    );

    // Verify the mock was called with correctly parsed filters
    const expectedFilters = {
      category: ["val1", "val2"],
      "category with space": ["value 1", "value 2, ok"],
    };
    expect(result.content).toContain(JSON.stringify(expectedFilters));
    expect(result.skipThisBlock).toBeUndefined();
    expect(result.addToMeta?.sources).toBeDefined();
    expect(result.addToMeta?.sources?.length).toBeGreaterThan(0);
  });

  test("should handle simple filters correctly", async () => {
    const match =
      "{{#similar_to search_for_variable=query filter:simpleCategory=simpleValue}}";
    const args: PlaceholderArgumentDict = {
      searchForVariable: "query",
      "filter:simpleCategory": "simpleValue",
    };
    const variables = { query: "test query" };

    const result = await similarToParser.replacerFunction(
      match,
      args,
      variables,
      mockContext
    );

    const expectedFilters = {
      simpleCategory: ["simpleValue"],
    };
    expect(result.content).toContain(JSON.stringify(expectedFilters));
  });
});
