import { describe, it, expect, beforeAll } from "bun:test";
import { initTemplateMessage } from "./init-message";
import { initTests, TEST_ORGANISATION_1 } from "../../../test/init.test";
import { getDb } from "../../../lib/db/db-connection";
import { promptTemplates } from "../../../lib/db/db-schema";
import { eq } from "drizzle-orm";
import { createFullPromptTemplate } from "./crud";

beforeAll(async () => {
  await initTests();
  await getDb()
    .delete(promptTemplates)
    .where(eq(promptTemplates.organisationId, TEST_ORGANISATION_1.id));
});

describe("Prompt Template Import", () => {
  let createdTemplateId: string;

  // Valid template data for testing
  const neededTemplateData = {
    name: "test-template-1",
    label: "test-template-1",
    category: "test",
    organisationId: TEST_ORGANISATION_1.id,
    description: "",
    systemPrompt: "ABC {{name}}",
    userPrompt: "DEF {{name_2}} {{name_3}}",
    placeholders: [
      {
        name: "name",
        label: "Name",
        description: "Name",
        defaultValue: "default value 1",
        required: true,
        suggestions: [],
      },
      {
        name: "name_2",
        label: "Name 2",
        description: "Name 2",
        defaultValue: "default value 2",
        required: false,
        suggestions: [],
      },
      {
        name: "name_3",
        label: "Name 3",
        description: "Name 3",
        defaultValue: "DEF1",
        required: false,
      },
    ],
  };

  it("adds a template to the database", async () => {
    const result = await createFullPromptTemplate(neededTemplateData);
    createdTemplateId = result.id;
    // Check if the template was created since this is needed for the test
    expect(result).toBeDefined();
  });

  it("should init a template message", async () => {
    const result = await initTemplateMessage({
      organisationId: TEST_ORGANISATION_1.id,
      template: "test:test-template-1",
      userInput: { name: "T1", name_2: "T2" },
    });

    expect(result).toBeDefined();
    expect(result.systemPrompt).toBe("ABC T1");
    expect(result.userPrompt).toBe("DEF T2 DEF1");
  });
});
