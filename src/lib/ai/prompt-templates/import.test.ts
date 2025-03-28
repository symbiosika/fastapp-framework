import { describe, it, expect, beforeAll } from "bun:test";
import { importPromptTemplate, type TemplateImportData } from "./import";
import { initTests, TEST_ORGANISATION_1 } from "../../../test/init.test";
import { getDb } from "../../../lib/db/db-connection";
import {
  promptTemplates,
  promptTemplatePlaceholders,
  promptTemplatePlaceholderExamples,
} from "../../../lib/db/db-schema";
import { eq } from "drizzle-orm";

beforeAll(async () => {
  await initTests();

  await getDb()
    .delete(promptTemplates)
    .where(eq(promptTemplates.organisationId, TEST_ORGANISATION_1.id));
});

describe("Prompt Template Import", () => {
  // Valid template data for testing
  const validTemplateData: TemplateImportData = {
    name: "Imported Test Template",
    label: "Imported Test Template",
    category: "test-import",
    organisationId: TEST_ORGANISATION_1.id,
    description: "A template created through import",
    systemPrompt: "This is a system prompt for the imported template",
    userPrompt:
      "This is a user prompt with {{placeholder1}} and {{placeholder2}}",
    placeholders: [
      {
        name: "placeholder1",
        description: "First placeholder",
        defaultValue: "default value 1",
        required: true,
        suggestions: ["suggestion 1", "suggestion 2", "suggestion 3"],
      },
      {
        name: "placeholder2",
        description: "Second placeholder",
        defaultValue: "default value 2",
        required: false,
        suggestions: [],
      },
    ],
  };

  // Invalid template data for testing
  const invalidTemplateData = {
    name: "Invalid Template",
    // Missing required fields like category, organisationId
    systemPrompt: "System prompt",
    userPrompt: "User prompt",
    placeholders: [
      {
        name: "placeholder",
        // Missing required defaultValue
        description: "A placeholder",
      },
    ],
  } as unknown as TemplateImportData;

  let createdTemplateId: string;

  it("should successfully import a complete template with placeholders and suggestions", async () => {
    const result = await importPromptTemplate(validTemplateData);

    // Check the result
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBe(validTemplateData.name);
    expect(result.category).toBe(validTemplateData.category);
    expect(result.message).toBeDefined();

    createdTemplateId = result.id;

    // Verify placeholders were created
    const db = getDb();
    const placeholders = await db.query.promptTemplatePlaceholders.findMany({
      where: eq(promptTemplatePlaceholders.promptTemplateId, createdTemplateId),
    });

    expect(placeholders.length).toBe(2);

    // Verify suggestions were created for the first placeholder
    const firstPlaceholder = placeholders.find(
      (p) => p.name === "placeholder1"
    );
    expect(firstPlaceholder).toBeDefined();

    if (firstPlaceholder) {
      const suggestions =
        await db.query.promptTemplatePlaceholderExamples.findMany({
          where: eq(
            promptTemplatePlaceholderExamples.placeholderId,
            firstPlaceholder.id
          ),
        });

      expect(suggestions.length).toBe(3);
      expect(suggestions.map((s) => s.value)).toContain("suggestion 1");
    }
  });

  it("should fail to import an invalid template", async () => {
    // This test should fail with validation error
    await expect(async () => {
      await importPromptTemplate(invalidTemplateData);
    }).toThrow("Corrupted template data");
  });

  // Cleanup after tests
  it("should clean up test data", async () => {
    if (createdTemplateId) {
      const db = getDb();

      // Find placeholders to delete their suggestions first
      const placeholders = await db.query.promptTemplatePlaceholders.findMany({
        where: eq(
          promptTemplatePlaceholders.promptTemplateId,
          createdTemplateId
        ),
      });

      // Delete suggestions for each placeholder
      for (const placeholder of placeholders) {
        await db
          .delete(promptTemplatePlaceholderExamples)
          .where(
            eq(promptTemplatePlaceholderExamples.placeholderId, placeholder.id)
          );
      }

      // Delete placeholders
      await db
        .delete(promptTemplatePlaceholders)
        .where(
          eq(promptTemplatePlaceholders.promptTemplateId, createdTemplateId)
        );

      // Delete template
      await db
        .delete(promptTemplates)
        .where(eq(promptTemplates.id, createdTemplateId));
    }
  });
});
