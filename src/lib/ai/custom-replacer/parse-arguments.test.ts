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

  test("should parse basic arguments with snake_case keys converted to camelCase", () => {
    const result = parseArgumentsWithoutLimits(
      '{{#test selector key_one=value1 key_two="value two"}}',
      "test"
    );
    expect(result).toEqual({ keyOne: "value1", keyTwo: "value two" });
  });

  test("should parse boolean and number arguments", () => {
    const result = parseArgumentsWithoutLimits(
      "{{#test selector flag=true count=10 price=12.5}}",
      "test"
    );
    expect(result).toEqual({ flag: true, count: 10, price: 12.5 });
  });

  test("should parse single-quoted keys without case conversion", () => {
    const result = parseArgumentsWithoutLimits(
      "{{#test selector 'key one'=value1 'key_two'='value two'}}",
      "test"
    );
    expect(result).toEqual({ "key one": "value1", key_two: "value two" });
  });

  test("should parse mixed quoted and unquoted keys", () => {
    const result = parseArgumentsWithoutLimits(
      "{{#test selector regular_key=val1 'quoted key'=val2}}",
      "test"
    );
    expect(result).toEqual({ regularKey: "val1", "quoted key": "val2" });
  });

  test("should handle quoted values for quoted keys", () => {
    const result = parseArgumentsWithoutLimits(
      "{{#test selector 'key one'=\"quoted value\"}}",
      "test"
    );
    expect(result).toEqual({ "key one": "quoted value" });
  });

  test("should return empty object for no arguments", () => {
    const result = parseArgumentsWithoutLimits("{{#test selector}}", "test");
    expect(result).toEqual({});
  });

  test("should return empty object for empty argument string", () => {
    const result = parseArgumentsWithoutLimits("{{#test selector }}", "test");
    expect(result).toEqual({});
  });

  test("should ignore extra content outside placeholder", () => {
    const result = parseArgumentsWithoutLimits(
      "Some text {{#test selector key=value}} more text",
      "test"
    );
    expect(result).toEqual({ key: "value" });
  });

  test("should parse complex example with mixed quotes and types", () => {
    const result = parseArgumentsWithoutLimits(
      "{{#test selector key_one=val1 'key two'=\"value 2\" flag=false count=99 'filter:category name'='\"val A\",\"val B, ok\"'}}",
      "test"
    );
    expect(result).toEqual({
      keyOne: "val1",
      "key two": "value 2",
      flag: false,
      count: 99,
      "filter:category name": '"val A","val B, ok"',
    });
  });

  test("should parse file placeholder with quoted values containing spaces", () => {
    const result = parseArgumentsWithoutLimits(
      "{{#file id='654787-asd asd-556561' name='ABC test 123'}}",
      "file"
    );
    expect(result).toEqual({
      id: "654787-asd asd-556561",
      name: "ABC test 123",
    });
  });

  test("should parse url placeholder with html parameter", () => {
    const result = parseArgumentsWithoutLimits(
      '{{#url html="https://www.heise.de"}}',
      "url"
    );
    expect(result).toEqual({ html: "https://www.heise.de" });
  });
});
