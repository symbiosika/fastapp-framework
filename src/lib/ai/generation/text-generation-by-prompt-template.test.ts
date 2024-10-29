import { describe, it, expect, beforeAll } from "bun:test";
import { textGenerationByPromptTemplate } from ".";
import {
  promptTemplatePlaceholders,
  promptTemplates,
} from "src/lib/db/db-schema";
import {
  createDatabaseClient,
  getDb,
  waitForDbConnection,
} from "src/lib/db/db-connection";
import { eq } from "drizzle-orm";

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();
});

describe("textGenerationByPromptTemplate", () => {
  it("should generate a response using a prompt template with deterministic output", async () => {
    // Setup test database
    const db = getDb();

    // Create a test prompt template that forces deterministic output
    const result = await db
      .insert(promptTemplates)
      .values({
        name: "Test Deterministic",
        category: "test",
        template: `
        {{#role=system}}
        You are a simple echo bot. You will only respond with:
        "Echo: " followed by the exact input provided in {{userInput}}.
        Do not add any other text or modifications.
        {{/role}}
        {{#role=user}}
        {{userInput}}
        {{/role}}
      `,
        hidden: false,
      })
      .returning();

    // Add placeholder configuration
    const promptPlaceholder = await db
      .insert(promptTemplatePlaceholders)
      .values({
        promptTemplateId: result[0].id,
        name: "userInput",
        defaultValue: "",
        requiredByUser: true,
      })
      .returning();

    try {
      const result2 = await textGenerationByPromptTemplate({
        promptId: result[0].id,
        usersPlaceholders: {
          userInput: "Hello World",
        },
      });

      expect(result2.responses.output).toBe("Echo: Hello World");
      expect(result2.lastOutputVarName).toBe("output");
      expect(result2.messages).toHaveLength(3); // system, user, assistant
    } finally {
      // Cleanup
      await db
        .delete(promptTemplatePlaceholders)
        .where(eq(promptTemplatePlaceholders.promptTemplateId, result[0].id));
      await db
        .delete(promptTemplates)
        .where(eq(promptTemplates.id, result[0].id));
    }
  });
});
