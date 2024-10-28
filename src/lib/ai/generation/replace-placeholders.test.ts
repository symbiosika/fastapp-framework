import { describe, it, expect } from "bun:test";
import { replacePlaceholders } from ".";

describe("replacePlaceholders", () => {
  it("should replace single placeholder in template", async () => {
    const template = "Hello {{name}}!";
    const placeholders = { name: "World" };
    const result = await replacePlaceholders(template, placeholders);
    expect(result).toBe("Hello World!");
  });

  it("should replace multiple occurrences of same placeholder", async () => {
    const template = "{{name}} {{name}} {{name}}";
    const placeholders = { name: "Test" };
    const result = await replacePlaceholders(template, placeholders);
    expect(result).toBe("Test Test Test");
  });

  it("should handle multiple different placeholders", async () => {
    const template = "{{greeting}} {{name}}! How is {{location}}?";
    const placeholders = {
      greeting: "Hi",
      name: "Alice",
      location: "London",
    };
    const result = await replacePlaceholders(template, placeholders);
    expect(result).toBe("Hi Alice! How is London?");
  });

  it("should respect whitelist when provided", async () => {
    const template = "{{greeting}} {{name}}!";
    const placeholders = {
      greeting: "Hi",
      name: "Alice",
    };
    const whitelist = ["greeting"];
    const result = await replacePlaceholders(template, placeholders, whitelist);
    expect(result).toBe("Hi {{name}}!");
  });

  it("should handle undefined and null values", async () => {
    const template = "Hello {{name}}, {{status}}!";
    const placeholders = {
      name: undefined,
      status: null,
    };
    const result = await replacePlaceholders(template, placeholders);
    expect(result).toBe("Hello , !");
  });

  it("should not modify template when no matches found", async () => {
    const template = "Hello World!";
    const placeholders = { name: "Test" };
    const result = await replacePlaceholders(template, placeholders);
    expect(result).toBe("Hello World!");
  });
});
