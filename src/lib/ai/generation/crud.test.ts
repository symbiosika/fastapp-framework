import { describe, it, expect, beforeAll } from "bun:test";
import {
  addPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  getPlainTemplate,
  addPromptTemplatePlaceholder,
  updatePromptTemplatePlaceholder,
  deletePromptTemplatePlaceholder,
  getPlainPlaceholdersForPromptTemplate,
} from "./crud";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../lib/db/db-connection";

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();
});

describe("Prompt Template CRUD Operations", () => {
  const testTemplate = {
    name: "Test Template",
    category: "test",
    prompt: "This is a test prompt",
    description: "Test description",
    hidden: false,
    template: "This is a test template",
    langCode: "en",
  };
  let createdTemplateId: string;

  it("should create a new prompt template", async () => {
    const result = await addPromptTemplate(testTemplate);
    expect(result.name).toBe(testTemplate.name);
    expect(result.id).toBeDefined();
    createdTemplateId = result.id;
  });

  it("should get a template by id", async () => {
    const result = await getPlainTemplate({ promptId: createdTemplateId });
    expect(result[0].name).toBe(testTemplate.name);
  });

  it("should update a prompt template", async () => {
    const updatedTemplate = {
      ...testTemplate,
      id: createdTemplateId,
      name: "Updated Template",
      label: "Updated Template",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: null,
      needsInitialCall: false,
    };
    const result = await updatePromptTemplate(updatedTemplate);
    expect(result.name).toBe("Updated Template");
  });

  it("should delete a prompt template", async () => {
    const result = await deletePromptTemplate(createdTemplateId);
    expect(result.success).toBe(true);

    // Verify deletion
    const templates = await getPlainTemplate({ promptId: createdTemplateId });
    expect(templates.length).toBe(0);
  });
});

describe("Prompt Template Placeholders CRUD Operations", () => {
  const testTemplate = {
    name: "Test Template",
    category: "test",
    prompt: "Test prompt",
    template: "Test prompt",
    hidden: false,
  };
  let templateId: string;
  let placeholderId: string;

  // Setup: Create a template first
  it("should setup test template", async () => {
    const result = await addPromptTemplate(testTemplate);
    templateId = result.id;
  });

  const testPlaceholder = {
    name: "test_placeholder",
    label: "test_placeholder",
    description: "Test placeholder",
    defaultValue: "default",
    hidden: false,
    type: "text" as const,
    requiredByUser: false,
  };

  it("should create a new placeholder", async () => {
    const placeholder = {
      ...testPlaceholder,
      promptTemplateId: templateId,
    };
    const result = await addPromptTemplatePlaceholder(placeholder);
    expect(result.name).toBe(testPlaceholder.name);
    expect(result.id).toBeDefined();
    placeholderId = result.id;
  });

  it("should get placeholders for a template", async () => {
    const placeholders =
      await getPlainPlaceholdersForPromptTemplate(templateId);
    expect(placeholders.length).toBe(1);
    expect(placeholders[0].name).toBe(testPlaceholder.name);
  });

  it("should update a placeholder", async () => {
    const updatedPlaceholder = {
      ...testPlaceholder,
      id: placeholderId,
      promptTemplateId: templateId,
      name: "updated_placeholder",
      label: "updated_placeholder",
      type: "text" as "text" | "image",
      requiredByUser: false,
    };
    const result = await updatePromptTemplatePlaceholder(updatedPlaceholder);
    expect(result.name).toBe("updated_placeholder");
  });

  it("should delete a placeholder", async () => {
    const result = await deletePromptTemplatePlaceholder(
      placeholderId,
      templateId
    );
    expect(result.success).toBe(true);

    // Verify deletion
    const placeholders =
      await getPlainPlaceholdersForPromptTemplate(templateId);
    expect(placeholders.length).toBe(0);
  });

  // Cleanup: Delete the test template
  it("should cleanup test data", async () => {
    await deletePromptTemplate(templateId);
  });
});
