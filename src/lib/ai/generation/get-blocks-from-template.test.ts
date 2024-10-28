import { describe, it, expect } from "bun:test";
import { getBlocksFromTemplate } from ".";

describe("getBlocksFromTemplate", () => {
  it("should parse a template with no break blocks", () => {
    const template = "Simple template with no breaks";
    const result = getBlocksFromTemplate(template);

    expect(result).toEqual([
      {
        template: "Simple template with no breaks",
        outputVarName: "output",
        forget: false,
        outputType: "text",
      },
    ]);
  });

  it("should parse a template with single break block", () => {
    const template = "First part{{#break output=var1}}Second part";
    const result = getBlocksFromTemplate(template);

    expect(result).toEqual([
      {
        template: "First part",
        outputVarName: "var1",
        forget: false,
        outputType: "text",
      },
      {
        template: "Second part",
        outputVarName: "output",
        forget: false,
        outputType: "text",
      },
    ]);
  });

  it("should parse a template with all break block options", () => {
    const template =
      "Part1{{#break output=var1 forget=true output_type=json}}Part2";
    const result = getBlocksFromTemplate(template);

    expect(result).toEqual([
      {
        template: "Part1",
        outputVarName: "var1",
        forget: true,
        outputType: "json",
      },
      {
        template: "Part2",
        outputVarName: "output",
        forget: false,
        outputType: "text",
      },
    ]);
  });

  it("should throw error on duplicate output variable names", () => {
    const template =
      "Part1{{#break output=var1}}Part2{{#break output=var1}}Part3";

    expect(() => getBlocksFromTemplate(template)).toThrow(
      "Duplicate output variable name var1 was found in Template."
    );
  });

  it("should handle multiple break blocks", () => {
    const template =
      "Part1{{#break output=var1}}Part2{{#break output=var2}}Part3";
    const result = getBlocksFromTemplate(template);

    expect(result).toEqual([
      {
        template: "Part1",
        outputVarName: "var1",
        forget: false,
        outputType: "text",
      },
      {
        template: "Part2",
        outputVarName: "var2",
        forget: false,
        outputType: "text",
      },
      {
        template: "Part3",
        outputVarName: "output",
        forget: false,
        outputType: "text",
      },
    ]);
  });
});
