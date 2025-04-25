import { describe, test, expect, mock } from "bun:test";
import { customAppPlaceholders } from "./custom-placeholders";
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

// Mock the getMarkdownFromUrl function
mock.module("../parsing/url", () => ({
  getMarkdownFromUrl: async (url: string) => {
    return `Mock markdown from URL: ${url}`;
  },
}));

// Mock the parseDocument function
mock.module("../parsing", () => ({
  parseDocument: async (params: any) => {
    return {
      content: `Mock document content for id: ${params.sourceId}`,
      title: "Mock Document Title",
    };
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

describe("customAppPlaceholders - url", () => {
  const urlParser = customAppPlaceholders.find((p) => p.name === "url");

  if (!urlParser) {
    throw new Error("url parser not found");
  }

  test("should correctly process url with html parameter", async () => {
    const match = '{{#url html="xxx"}}';
    const args: PlaceholderArgumentDict = {
      html: "https://example.com",
    };
    const variables = {};

    const result = await urlParser.replacerFunction(
      match,
      args,
      variables,
      mockContext
    );

    expect(result.content).toBe("Mock markdown from URL: https://example.com");
    expect(result.skipThisBlock).toBeUndefined();
  });

  test("should correctly process url with url parameter", async () => {
    const match = '{{#url url="https://another-example.com"}}';
    const args: PlaceholderArgumentDict = {
      url: "https://another-example.com",
    };
    const variables = {};

    const result = await urlParser.replacerFunction(
      match,
      args,
      variables,
      mockContext
    );

    expect(result.content).toBe(
      "Mock markdown from URL: https://another-example.com"
    );
    expect(result.skipThisBlock).toBeUndefined();
  });
});

describe("customAppPlaceholders - file", () => {
  const fileParser = customAppPlaceholders.find((p) => p.name === "file");

  if (!fileParser) {
    throw new Error("file parser not found");
  }

  test("should correctly process file with id and name", async () => {
    const match = "{{#file id='654787-asd asd-556561' name='ABC test 123'}}";
    const args: PlaceholderArgumentDict = {
      id: "654787-asd asd-556561",
      name: "ABC test 123",
    };
    const variables = {};

    const result = await fileParser.replacerFunction(
      match,
      args,
      variables,
      mockContext
    );

    expect(result.content).toBe(
      "Mock document content for id: 654787-asd asd-556561"
    );
    expect(result.skipThisBlock).toBeUndefined();
    expect(result.addToMeta?.sources).toBeDefined();
    expect(result.addToMeta?.sources?.length).toBe(1);
    expect(result.addToMeta?.sources?.[0].id).toBe("654787-asd asd-556561");
    expect(result.addToMeta?.sources?.[0].type).toBe("file");
  });

  test("should handle multiple ids correctly", async () => {
    const match = "{{#file id='id1,id2'}}";
    const args: PlaceholderArgumentDict = {
      id: "id1,id2",
    };
    const variables = {};

    const result = await fileParser.replacerFunction(
      match,
      args,
      variables,
      mockContext
    );

    // The content should contain both document contents concatenated
    expect(result.content).toBe(
      "Mock document content for id: id1Mock document content for id: id2"
    );
    expect(result.addToMeta?.sources?.length).toBe(2);
    expect(result.addToMeta?.sources?.[0].id).toBe("id1");
    expect(result.addToMeta?.sources?.[1].id).toBe("id2");
  });
});
