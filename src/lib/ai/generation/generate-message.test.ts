import { describe, it, expect } from "bun:test";
import { generateMessage } from ".";

describe("generateMessage", () => {
  it("should create a message with correct role and replaced placeholders", async () => {
    const role = "user";
    const content = "Hello {{name}}, your age is {{age}}";
    const whitelist = ["name", "age"];
    const usersData = { name: "John" };
    const defaultData = { age: "25" };

    const result = await generateMessage(
      role,
      content,
      whitelist,
      usersData,
      defaultData
    );

    expect(result).toEqual({
      role: "user",
      content: "Hello John, your age is 25",
    });
  });

  it("should default to user role for invalid roles", async () => {
    const result = await generateMessage("invalid_role", "content", [], {}, {});

    expect(result.role).toBe("user");
  });

  it("should handle empty placeholders", async () => {
    const content = "Hello {{name}}";
    const whitelist = ["name"];
    const result = await generateMessage("system", content, whitelist, {}, {});

    expect(result.content).toBe("Hello {{name}}");
  });

  it("should prioritize usersData over defaultData", async () => {
    const content = "Value: {{key}}";
    const whitelist = ["key"];
    const usersData = { key: "user value" };
    const defaultData = { key: "default value" };

    const result = await generateMessage(
      "assistant",
      content,
      whitelist,
      usersData,
      defaultData
    );

    expect(result.content).toBe("Value: user value");
  });
});
