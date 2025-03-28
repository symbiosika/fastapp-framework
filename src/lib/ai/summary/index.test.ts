import { describe, test, expect, beforeAll, mock } from "bun:test";
import { generateDocumentSummary, generateChunkBasedSummary } from ".";
import { chatCompletion } from "../standard";

// Mock the chatCompletion function
mock.module("../standard", () => ({
  chatCompletion: mock(async () => "This is a test summary"),
}));

describe("Summary Generation", () => {
  const testContext = {
    organisationId: "test-org-id",
    userId: "test-user-id",
  };

  describe("generateDocumentSummary", () => {
    test("should generate a summary for a document", async () => {
      const text = "This is a test document content.";
      const title = "Test Document";
      
      const result = await generateDocumentSummary(text, title, testContext);
      
      expect(result).toEqual({
        description: "This is a test summary",
      });
    });

    test("should handle empty text", async () => {
      const text = "";
      const title = "Empty Document";
      
      const result = await generateDocumentSummary(text, title, testContext);
      
      expect(result).toEqual({
        description: "This is a test summary",
      });
    });

    test("should use custom prompt when provided", async () => {
      const text = "Test content";
      const title = "Test Document";
      const customPrompt = "Custom summary prompt";
      
      const result = await generateDocumentSummary(text, title, testContext, {
        customPrompt,
      });
      
      expect(result).toEqual({
        description: "This is a test summary",
      });
    });
  });

  describe("generateChunkBasedSummary", () => {
    test("should generate a summary for a single chunk", async () => {
      const chunks = [
        {
          text: "This is a test chunk content.",
          header: "Test Section",
        },
      ];
      const title = "Test Document";
      
      const result = await generateChunkBasedSummary(chunks, title, testContext);
      
      expect(result).toEqual({
        description: "This is a test summary",
      });
    });

    test("should handle multiple chunks", async () => {
      const chunks = [
        {
          text: "First chunk content.",
          header: "First Section",
        },
        {
          text: "Second chunk content.",
          header: "Second Section",
        },
      ];
      const title = "Test Document";
      
      const result = await generateChunkBasedSummary(chunks, title, testContext);
      
      expect(result).toEqual({
        description: "This is a test summary",
      });
    });

    test("should handle empty chunks array", async () => {
      const chunks: { text: string; header?: string }[] = [];
      const title = "Test Document";
      
      const result = await generateChunkBasedSummary(chunks, title, testContext);
      
      expect(result).toEqual({
        description: "",
      });
    });
  });
}); 