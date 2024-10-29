import { describe, it, expect } from "bun:test";
import { parseSimilarToQueries } from ".";

describe("parseSimilarToQueries", () => {
  it("should parse a template with search_for only", () => {
    const template = "Some text {{#similar_to search_for=example}} more text";
    const result = parseSimilarToQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#similar_to search_for=example}}",
        searchFor: ["example"],
        id: undefined,
        category1: undefined,
        category2: undefined,
        category3: undefined,
        names: undefined,
      },
    ]);
  });

  it("should parse individual numbered categories", () => {
    const template =
      "Text {{#similar_to search_for=example category1=cat1,cat2 category2=cat3,cat4 category3=cat5,cat6}} more";
    const result = parseSimilarToQueries(template);

    expect(result).toEqual([
      {
        fullMatch:
          "{{#similar_to search_for=example category1=cat1,cat2 category2=cat3,cat4 category3=cat5,cat6}}",
        searchFor: ["example"],
        id: undefined,
        category1: ["cat1", "cat2"],
        category2: ["cat3", "cat4"],
        category3: ["cat5", "cat6"],
        names: undefined,
      },
    ]);
  });

  it("should parse names only", () => {
    const template =
      "Text {{#similar_to search_for=example name=name1,name2}} more";
    const result = parseSimilarToQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#similar_to search_for=example name=name1,name2}}",
        searchFor: ["example"],
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
      {{#similar_to search_for=example1}}
      {{#similar_to search_for=example2 category1=cat1,cat2}}
      {{#similar_to search_for=example3 name=name1,name2}}
    `;
    const result = parseSimilarToQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#similar_to search_for=example1}}",
        searchFor: ["example1"],
        id: undefined,
        category1: undefined,
        category2: undefined,
        category3: undefined,
        names: undefined,
      },
      {
        fullMatch: "{{#similar_to search_for=example2 category1=cat1,cat2}}",
        searchFor: ["example2"],
        id: undefined,
        category1: ["cat1", "cat2"],
        category2: undefined,
        category3: undefined,
        names: undefined,
      },
      {
        fullMatch: "{{#similar_to search_for=example3 name=name1,name2}}",
        searchFor: ["example3"],
        id: undefined,
        category1: undefined,
        category2: undefined,
        category3: undefined,
        names: ["name1", "name2"],
      },
    ]);
  });

  it("should parse multiple search_for values", () => {
    const template =
      "Some text {{#similar_to search_for=example1,example2}} more text";
    const result = parseSimilarToQueries(template);

    expect(result).toEqual([
      {
        fullMatch: "{{#similar_to search_for=example1,example2}}",
        searchFor: ["example1", "example2"],
        id: undefined,
        category1: undefined,
        category2: undefined,
        category3: undefined,
        names: undefined,
      },
    ]);
  });

  it("should parse a template with all parameters", () => {
    const template =
      "{{#similar_to search_for=example id=123,456 category1=cat1,cat2 category2=cat3 category3=cat4 name=name1,name2}}";
    const result = parseSimilarToQueries(template);

    expect(result).toEqual([
      {
        fullMatch:
          "{{#similar_to search_for=example id=123,456 category1=cat1,cat2 category2=cat3 category3=cat4 name=name1,name2}}",
        searchFor: ["example"],
        id: ["123", "456"],
        category1: ["cat1", "cat2"],
        category2: ["cat3"],
        category3: ["cat4"],
        names: ["name1", "name2"],
      },
    ]);
  });

  it("should return empty array for invalid queries", () => {
    const template = "{{#similar_to}}";
    const result = parseSimilarToQueries(template);

    expect(result).toEqual([]);
  });

  it("should parse numeric parameters (count, before, after)", () => {
    const template =
      "{{#similar_to search_for=example count=5 before=2 after=3}}";
    const result = parseSimilarToQueries(template);

    expect(result).toEqual([
      {
        fullMatch:
          "{{#similar_to search_for=example count=5 before=2 after=3}}",
        searchFor: ["example"],
        id: undefined,
        category1: undefined,
        category2: undefined,
        category3: undefined,
        names: undefined,
        count: 5,
        before: 2,
        after: 3,
      },
    ]);
  });

  it("should parse template with all parameters including numeric ones", () => {
    const template =
      "{{#similar_to search_for=example1,example2 id=123,456 category1=cat1,cat2 category2=cat3 category3=cat4 name=name1,name2 count=10 before=1 after=1}}";
    const result = parseSimilarToQueries(template);

    expect(result).toEqual([
      {
        fullMatch:
          "{{#similar_to search_for=example1,example2 id=123,456 category1=cat1,cat2 category2=cat3 category3=cat4 name=name1,name2 count=10 before=1 after=1}}",
        searchFor: ["example1", "example2"],
        id: ["123", "456"],
        category1: ["cat1", "cat2"],
        category2: ["cat3"],
        category3: ["cat4"],
        names: ["name1", "name2"],
        count: 10,
        before: 1,
        after: 1,
      },
    ]);
  });

  it("should handle numeric parameters with invalid values", () => {
    const template =
      "{{#similar_to search_for=example count=abc before=def after=ghi}}";
    const result = parseSimilarToQueries(template);

    expect(result).toEqual([
      {
        fullMatch:
          "{{#similar_to search_for=example count=abc before=def after=ghi}}",
        searchFor: ["example"],
        id: undefined,
        category1: undefined,
        category2: undefined,
        category3: undefined,
        names: undefined,
        count: undefined,
        before: undefined,
        after: undefined,
      },
    ]);
  });
});
