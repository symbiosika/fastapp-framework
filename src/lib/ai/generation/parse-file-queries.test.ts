import { describe, it, expect } from "bun:test";
import { parseFileQueries } from ".";
import { FileSourceType } from "../../../lib/storage";
describe("parseFileQueries", () => {
  it("should parse file query with id and fileSource in normal order", () => {
    const template = "{{#file id=a source=db}}";
    const result = parseFileQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#file id=a source=db}}",
        id: "a",
        fileSource: FileSourceType.DB,
        bucket: "default",
      },
    ]);
  });

  it("should parse file query with id and fileSource in reverse order", () => {
    const template = "{{#file source=local id=a}}";
    const result = parseFileQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#file source=local id=a}}",
        id: "a",
        fileSource: FileSourceType.LOCAL,
        bucket: "default",
      },
    ]);
  });

  it("should parse file query with only id (default to db)", () => {
    const template = "{{#file id=a}}";
    const result = parseFileQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#file id=a}}",
        id: "a",
        fileSource: FileSourceType.DB,
        bucket: "default",
      },
    ]);
  });

  it("should parse multiple file queries", () => {
    const template =
      "{{#file id=a source=db}} some text {{#file source=local id=b}}";
    const result = parseFileQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#file id=a source=db}}",
        id: "a",
        fileSource: FileSourceType.DB,
        bucket: "default",
      },
      {
        fullMatch: "{{#file source=local id=b}}",
        id: "b",
        fileSource: FileSourceType.LOCAL,
        bucket: "default",
      },
    ]);
  });

  it("should parse file query with bucket", () => {
    const template = "{{#file id=a source=db bucket=mybucket}}";
    const result = parseFileQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#file id=a source=db bucket=mybucket}}",
        id: "a",
        fileSource: FileSourceType.DB,
        bucket: "mybucket",
      },
    ]);
  });

  it("should return empty array if no matches found", () => {
    const template = "no matches here";
    const result = parseFileQueries(template);

    expect(result).toEqual([]);
  });
});
