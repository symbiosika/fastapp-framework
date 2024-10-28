import { describe, it, expect } from "bun:test";
import { parseKnowledgebaseQueries } from ".";

describe("parseKnowledgebaseQueries", () => {
  it("should parse a template with id only", () => {
    const template = "Some text {{#knowledgebase id=123}} more text";
    const result = parseKnowledgebaseQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#knowledgebase id=123}}",
        id: ["123"],
        category1: undefined,
        category2: undefined,
        category3: undefined,
        names: undefined,
      },
    ]);
  });

  it("should parse individual numbered categories", () => {
    const template =
      "Text {{#knowledgebase category1=cat1,cat2 category2=cat3,cat4 category3=cat5,cat6}} more";
    const result = parseKnowledgebaseQueries(template);

    expect(result).toEqual([
      {
        fullMatch:
          "{{#knowledgebase category1=cat1,cat2 category2=cat3,cat4 category3=cat5,cat6}}",
        id: undefined,
        category1: ["cat1", "cat2"],
        category2: ["cat3", "cat4"],
        category3: ["cat5", "cat6"],
        names: undefined,
      },
    ]);
  });

  it("should parse names only", () => {
    const template = "Text {{#knowledgebase name=name1,name2}} more";
    const result = parseKnowledgebaseQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#knowledgebase name=name1,name2}}",
        id: undefined,
        category1: undefined,
        category2: undefined,
        category3: undefined,
        names: ["name1", "name2"],
      },
    ]);
  });

  it("should parse multiple queries in one template", () => {
    const template = `
      {{#knowledgebase id=123}}
      {{#knowledgebase category1=cat1,cat2}}
      {{#knowledgebase name=name1,name2}}
    `;
    const result = parseKnowledgebaseQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#knowledgebase id=123}}",
        id: ["123"],
        category1: undefined,
        category2: undefined,
        category3: undefined,
        names: undefined,
      },
      {
        fullMatch: "{{#knowledgebase category1=cat1,cat2}}",
        id: undefined,
        category1: ["cat1", "cat2"],
        category2: undefined,
        category3: undefined,
        names: undefined,
      },
      {
        fullMatch: "{{#knowledgebase name=name1,name2}}",
        id: undefined,
        category1: undefined,
        category2: undefined,
        category3: undefined,
        names: ["name1", "name2"],
      },
    ]);
  });

  it("should parse multiple ids", () => {
    const template = "Some text {{#knowledgebase id=123,456,789}} more text";
    const result = parseKnowledgebaseQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#knowledgebase id=123,456,789}}",
        id: ["123", "456", "789"],
        category1: undefined,
        category2: undefined,
        category3: undefined,
        names: undefined,
      },
    ]);
  });

  it("should parse a template with all parameters", () => {
    const template =
      "{{#knowledgebase id=123,456 category1=cat1,cat2 category2=cat3 category3=cat4 name=name1,name2}}";
    const result = parseKnowledgebaseQueries(template);

    expect(result).toEqual([
      {
        fullMatch:
          "{{#knowledgebase id=123,456 category1=cat1,cat2 category2=cat3 category3=cat4 name=name1,name2}}",
        id: ["123", "456"],
        category1: ["cat1", "cat2"],
        category2: ["cat3"],
        category3: ["cat4"],
        names: ["name1", "name2"],
      },
    ]);
  });

  it("should return empty array for invalid queries", () => {
    const template = "{{#knowledgebase}}";
    const result = parseKnowledgebaseQueries(template);

    expect(result).toEqual([]);
  });
});
