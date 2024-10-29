import { describe, it, expect } from "bun:test";
import { parseUrlQueries } from ".";

describe("parseUrlQueries", () => {
  it("should parse a single URL query", () => {
    const template = 'Some text {{#url="https://example.com"}} more text';
    const result = parseUrlQueries(template);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      fullMatch: '{{#url="https://example.com"}}',
      url: "https://example.com",
    });
  });

  it("should parse multiple URL queries", () => {
    const template = `
      First URL: {{#url="https://example1.com"}}
      Second URL: {{#url="https://example2.com"}}
    `;
    const result = parseUrlQueries(template);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      fullMatch: '{{#url="https://example1.com"}}',
      url: "https://example1.com",
    });
    expect(result[1]).toEqual({
      fullMatch: '{{#url="https://example2.com"}}',
      url: "https://example2.com",
    });
  });

  it("should handle URL queries with comments", () => {
    const template = '{{#url="https://example.com" comment="test comment"}}';
    const result = parseUrlQueries(template);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      fullMatch: '{{#url="https://example.com" comment="test comment"}}',
      url: "https://example.com",
    });
  });

  it("should return empty array when no URLs found", () => {
    const template = "Text without any URL queries";
    const result = parseUrlQueries(template);

    expect(result).toHaveLength(0);
  });

  it("should handle URLs with query parameters", () => {
    const template = '{{#url="https://example.com/path?param=value"}}';
    const result = parseUrlQueries(template);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      fullMatch: '{{#url="https://example.com/path?param=value"}}',
      url: "https://example.com/path?param=value",
    });
  });
});
