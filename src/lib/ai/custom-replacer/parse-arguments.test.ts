import { describe, test, expect } from "bun:test";
import { parseArgumentsWithoutLimits } from "./parse-arguments";

describe("parseArgumentsWithoutLimits", () => {
  test("parses boolean values correctly", () => {
    const result = parseArgumentsWithoutLimits(
      "{{#selector arg1=true arg2=false}}",
      "selector"
    );
    expect(result).toEqual({ arg1: true, arg2: false });
  });

  test("parses numeric values correctly", () => {
    const result = parseArgumentsWithoutLimits(
      "{{#selector num1=42 num2=3.14}}",
      "selector"
    );
    expect(result).toEqual({ num1: 42, num2: 3.14 });
  });

  test("parses string values correctly", () => {
    const result = parseArgumentsWithoutLimits(
      "{{#selector str1='hello' str2=\"world\"}}",
      "selector"
    );
    expect(result).toEqual({ str1: "hello", str2: "world" });
  });

  test("parses mixed argument types correctly", () => {
    const result = parseArgumentsWithoutLimits(
      "{{#selector bool=true num=123 str='test'}}",
      "selector"
    );
    expect(result).toEqual({ bool: true, num: 123, str: "test" });
  });

  test("handles empty arguments correctly", () => {
    const result = parseArgumentsWithoutLimits("{{#selector}}", "selector");
    expect(result).toEqual({});
  });

  test("handles invalid inputs gracefully", () => {
    const result = parseArgumentsWithoutLimits(
      "{{#selector invalid}}",
      "selector"
    );
    expect(result).toEqual({});
  });

  test("converts snake_case keys to camelCase", () => {
    const result = parseArgumentsWithoutLimits(
      "{{#selector snake_case_key='value'}}",
      "selector"
    );
    expect(result).toEqual({ snakeCaseKey: "value" });
  });
});
