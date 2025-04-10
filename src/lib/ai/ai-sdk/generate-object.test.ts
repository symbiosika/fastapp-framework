import { describe, it, expect, beforeAll } from "bun:test";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_USER_1,
} from "../../../test/init.test";
import { chatCompletionWithObjectOutput } from "./generate-object";
import { jsonSchema } from "ai";
import type { CoreMessage } from "ai";

// Define the schema for tasks
const taskSchema = jsonSchema<{
  tasks: Array<{
    name: string;
    description: string;
  }>;
}>({
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "description"],
      },
    },
  },
  required: ["tasks"],
});

describe("chatCompletionWithObjectOutput", () => {
  beforeAll(async () => {
    await initTests();
  });

  it("should generate tasks based on a prompt", async () => {
    const messages: CoreMessage[] = [
      {
        role: "user",
        content:
          "Generate 3 tasks for a project management system. Each task should have a name and description.",
      },
    ];

    const context = {
      organisationId: TEST_ORGANISATION_1.id,
      userId: TEST_USER_1.id,
    };

    const result = await chatCompletionWithObjectOutput(messages, context, {
      schema: taskSchema,
      temperature: 0.7,
    });

    // Verify the response structure
    expect(result).toBeDefined();
    const responseObject = result.object as {
      tasks: Array<{ name: string; description: string }>;
    };
    expect(responseObject).toBeDefined();
    expect(responseObject.tasks).toBeDefined();
    expect(Array.isArray(responseObject.tasks)).toBeTruthy();
    expect(responseObject.tasks.length).toBeGreaterThan(0);

    // Verify each task has the required properties
    responseObject.tasks.forEach((task) => {
      expect(task).toHaveProperty("name");
      expect(task).toHaveProperty("description");
      expect(typeof task.name).toBe("string");
      expect(typeof task.description).toBe("string");
      expect(task.name.length).toBeGreaterThan(0);
      expect(task.description.length).toBeGreaterThan(0);
    });

    // Verify meta information
    expect(result.meta).toBeDefined();
    expect(result.meta.usedTokens).toBeDefined();
    expect(result.meta.promptTokens).toBeDefined();
    expect(result.meta.completionTokens).toBeDefined();
  }, 30000);
});
