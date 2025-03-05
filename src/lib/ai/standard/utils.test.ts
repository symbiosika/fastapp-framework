import { describe, test, expect } from "bun:test";
import { countWords, extractThinkingsAndContent } from "./utils";

describe("Utility Functions", () => {
  describe("countWords", () => {
    test("should count words in a simple string", () => {
      expect(countWords("hello world")).toBe(2);
    });

    test("should handle empty string", () => {
      expect(countWords("")).toBe(0);
    });

    test("should handle string with multiple spaces", () => {
      expect(countWords("hello   world")).toBe(2);
    });

    test("should handle string with newlines and tabs", () => {
      expect(countWords("hello\nworld\ttest")).toBe(3);
    });

    test("should handle string with punctuation", () => {
      expect(countWords("hello, world! How are you?")).toBe(5);
    });
  });

  describe("extractThinkingsAndContent", () => {
    test("should handle undefined input", () => {
      const result = extractThinkingsAndContent(undefined);
      expect(result.thinkings).toEqual([]);
      expect(result.content).toBe("");
    });

    test("should handle empty string", () => {
      const result = extractThinkingsAndContent("");
      expect(result.thinkings).toEqual([]);
      expect(result.content).toBe("");
    });

    test("should handle text without think tags", () => {
      const text = "This is a simple text without any think tags.";
      const result = extractThinkingsAndContent(text);
      expect(result.thinkings).toEqual([]);
      expect(result.content).toBe(text);
    });

    test("should extract single thinking block", () => {
      const text = "This is <think>my thinking process</think> a test.";
      const result = extractThinkingsAndContent(text);
      expect(result.thinkings).toEqual(["my thinking process"]);
      expect(result.content).toBe("This is  a test.");
    });

    test("should extract multiple thinking blocks", () => {
      const text =
        "Start <think>first thinking</think> middle <think>second thinking</think> end.";
      const result = extractThinkingsAndContent(text);
      expect(result.thinkings).toEqual(["first thinking", "second thinking"]);
      expect(result.content).toBe("Start  middle  end.");
    });

    test("should handle multiline think tags", () => {
      const text = `Here is some text.
<think>
This is a multiline
thinking block.
</think>
And here is more text.`;
      const result = extractThinkingsAndContent(text);
      expect(result.thinkings).toEqual([
        "This is a multiline\nthinking block.",
      ]);
      expect(result.content).toBe(
        "Here is some text.\n\nAnd here is more text."
      );
    });
  });
});
