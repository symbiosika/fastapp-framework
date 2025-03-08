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
import { initTests, TEST_ORGANISATION_1 } from "../../../test/init.test";

beforeAll(async () => {
  await initTests();
});

describe("Prompt Template CRUD Operations", () => {
  const testTemplate = {
    organisationId: TEST_ORGANISATION_1.id,
    name: "Test Template",
    category: "test",
    prompt: "This is a test prompt",
    description: "Test description",
    hidden: false,
    systemPrompt: "This is a test template",
    userPrompt: null,
    langCode: "en",
    needsInitialCall: false,
    llmOptions: {},
  };
  const testPlaceholder = {
    name: "test_placeholder",
    label: "test_placeholder",
    description: "Test placeholder",
    defaultValue: "default",
    hidden: false,
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
    const result = await deletePromptTemplate(
      createdTemplateId,
      testTemplate.organisationId
    );
    expect(result.success).toBe(true);

    // Verify deletion
    const templates = await getPlainTemplate({ promptId: createdTemplateId });
    expect(templates.length).toBe(0);
  });
});

describe("Prompt Template Placeholders CRUD Operations", () => {
  const testTemplate = {
    organisationId: TEST_ORGANISATION_1.id,
    name: "Test Template",
    category: "test",
    prompt: "Test prompt",
    systemPrompt: "Test prompt",
    userPrompt: null,
    langCode: "en",
    needsInitialCall: false,
    llmOptions: {},
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
    await deletePromptTemplate(templateId, testTemplate.organisationId);
  });
});

describe("Prompt Template Placeholder Suggestions", () => {
  const testTemplate = {
    organisationId: TEST_ORGANISATION_1.id,
    name: "Suggestions Test Template",
    category: "test",
    prompt: "Test prompt with suggestions",
    systemPrompt: "Test prompt with suggestions",
    userPrompt: null,
    langCode: "en",
    needsInitialCall: false,
    llmOptions: {},
    hidden: false,
  };
  const testPlaceholder = {
    name: "test_placeholder",
    label: "test_placeholder",
    description: "Test placeholder",
    defaultValue: "default",
    hidden: false,
    requiredByUser: true,
    type: "text" as const,
  };
  let templateId: string;
  let placeholderId: string;

  // Setup: Create a template first
  it("should setup test template", async () => {
    const result = await addPromptTemplate(testTemplate);
    templateId = result.id;
  });

  it("should create a placeholder with suggestions", async () => {
    const placeholder = {
      name: "placeholder_with_suggestions",
      label: "Placeholder with suggestions",
      description: "Test placeholder with suggestions",
      defaultValue: "default value",
      hidden: false,
      type: "text" as const,
      requiredByUser: true,
      promptTemplateId: templateId,
      suggestions: ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
    };

    const result = await addPromptTemplatePlaceholder(placeholder);
    expect(result.name).toBe(placeholder.name);
    expect(result.id).toBeDefined();
    placeholderId = result.id;

    // We can't directly verify suggestions here as they're stored in a separate table
    // and the function doesn't return them
  });

  it("should update a placeholder with new suggestions", async () => {
    const updatedPlaceholder = {
      id: placeholderId,
      promptTemplateId: templateId,
      name: "updated_placeholder_with_suggestions",
      label: "Updated placeholder with suggestions",
      description: "Updated test placeholder with suggestions",
      defaultValue: "updated default",
      hidden: false,
      type: "text" as const,
      requiredByUser: true,
      suggestions: [
        "Updated Suggestion 1",
        "Updated Suggestion 2",
        "Updated Suggestion 3",
        "New Suggestion 4",
      ],
    };

    const result = await updatePromptTemplatePlaceholder(updatedPlaceholder);
    expect(result.name).toBe(updatedPlaceholder.name);
  });

  it("should update a placeholder to remove all suggestions", async () => {
    const updatedPlaceholder = {
      ...testPlaceholder,
      id: placeholderId,
      promptTemplateId: templateId,
      name: "updated_placeholder_no_suggestions",
      suggestions: [], // Empty array to remove all suggestions
    };

    const result = await updatePromptTemplatePlaceholder(updatedPlaceholder);
    expect(result.name).toBe(updatedPlaceholder.name);
  });

  it("should update a placeholder to add new suggestions after removing them", async () => {
    const updatedPlaceholder = {
      ...testPlaceholder,
      id: placeholderId,
      promptTemplateId: templateId,
      suggestions: ["New suggestion after removal"],
    };

    const result = await updatePromptTemplatePlaceholder(updatedPlaceholder);
    expect(result.id).toBe(placeholderId);
  });

  // Cleanup: Delete the placeholder and template
  it("should cleanup test data", async () => {
    await deletePromptTemplatePlaceholder(placeholderId, templateId);
    await deletePromptTemplate(templateId, testTemplate.organisationId);
  });
});
