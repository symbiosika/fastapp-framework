import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  addPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  getPlainTemplate,
  addPromptTemplatePlaceholder,
  updatePromptTemplatePlaceholder,
  deletePromptTemplatePlaceholder,
  getPlainPlaceholdersForPromptTemplate,
  createFullPromptTemplate,
  getFullPromptTemplate,
  getFullPromptTemplates,
} from "./crud";
import {
  initTests,
  TEST_ADMIN_USER,
  TEST_ORGANISATION_1,
} from "../../../test/init.test";
import { getDb, type PromptTemplatePlaceholdersInsert } from "../../../dbSchema";
import {
  knowledgeEntry,
  knowledgeFilters,
  knowledgeGroup,
} from "../../db/schema/knowledge";
import { eq } from "drizzle-orm";

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
    tools: { enabled: ["tool1", "tool2"] },
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
    expect(result.tools).toEqual(testTemplate.tools);
    createdTemplateId = result.id;
  });

  it("should get a template by id", async () => {
    const result = await getPlainTemplate({ promptId: createdTemplateId });
    expect(result.name).toBe(testTemplate.name);
    expect(result.tools).toEqual(testTemplate.tools);
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
      tools: { enabled: ["updated_tool1", "updated_tool2"] },
    };
    const result = await updatePromptTemplate(updatedTemplate);
    expect(result.name).toBe("Updated Template");
    expect(result.tools).toEqual(updatedTemplate.tools);
  });

  it("should delete a prompt template", async () => {
    const result = await deletePromptTemplate(
      createdTemplateId,
      testTemplate.organisationId
    );
    expect(result.success).toBe(true);
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
    tools: { enabled: ["tool3"] },
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
    tools: { enabled: ["tool4", "tool5"] },
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

describe("Complete Prompt Template Operations", () => {
  const testTemplate = {
    organisationId: TEST_ORGANISATION_1.id,
    name: "Complete Test Template",
    category: "test",
    systemPrompt: "Test system prompt",
    userPrompt: "Test user prompt with {{placeholder1}}",
    description: "Test description",
    hidden: false,
    langCode: "en",
    needsInitialCall: false,
    llmOptions: {},
    tools: { enabled: ["tool6"] },
  };

  const testPlaceholders: (PromptTemplatePlaceholdersInsert & {
    suggestions?: string[];
  })[] = [
    {
      name: "placeholder1",
      label: "Placeholder 1",
      description: "First placeholder",
      defaultValue: "default value 1",
      type: "text" as const,
      requiredByUser: true,
      suggestions: ["suggestion 1", "suggestion 2"],
      promptTemplateId: "",
    },
  ];

  let createdTemplateId: string;
  let knowledgeEntryId: string;
  let knowledgeFilterId: string;
  let knowledgeGroupId: string;

  beforeAll(async () => {
    // Create test knowledge entry
    const entry = await getDb()
      .insert(knowledgeEntry)
      .values({
        organisationId: TEST_ORGANISATION_1.id,
        name: "Test Knowledge Entry",
        description: "Test description",
        sourceType: "text",
      })
      .returning();
    knowledgeEntryId = entry[0].id;

    // Create test knowledge filter
    const filter = await getDb()
      .insert(knowledgeFilters)
      .values({
        organisationId: TEST_ORGANISATION_1.id,
        category: "test",
        name: "Test Filter",
      })
      .returning();
    knowledgeFilterId = filter[0].id;

    // Create test knowledge group
    const group = await getDb()
      .insert(knowledgeGroup)
      .values({
        organisationId: TEST_ORGANISATION_1.id,
        name: "Test Group",
        description: "Test group description",
        userId: TEST_ADMIN_USER.id,
        organisationWideAccess: false,
      })
      .returning();
    knowledgeGroupId = group[0].id;
  });

  it("should create a complete prompt template with all related data", async () => {
    const result = await createFullPromptTemplate({
      ...testTemplate,
      placeholders: testPlaceholders,
      knowledgeEntryIds: [knowledgeEntryId],
      knowledgeFilterIds: [knowledgeFilterId],
      knowledgeGroupIds: [knowledgeGroupId],
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBe(testTemplate.name);
    expect(result.tools).toEqual(testTemplate.tools);
    expect(result.placeholders.length).toBe(1);
    expect(result.knowledgeEntries.length).toBe(1);
    expect(result.knowledgeFilters.length).toBe(1);
    expect(result.knowledgeGroups.length).toBe(1);

    createdTemplateId = result.id;
  });

  it("should get a complete prompt template", async () => {
    const result = await getFullPromptTemplate({
      promptId: createdTemplateId,
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(createdTemplateId);
    expect(result.tools).toEqual(testTemplate.tools);
    expect(result.placeholders.length).toBe(1);
    expect(result.knowledgeEntries.length).toBe(1);
    expect(result.knowledgeFilters.length).toBe(1);
    expect(result.knowledgeGroups.length).toBe(1);
  });

  it("should get all complete prompt templates for an organisation", async () => {
    const results = await getFullPromptTemplates(TEST_ORGANISATION_1.id);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("tools");
    expect(results[0]).toHaveProperty("placeholders");
    expect(results[0]).toHaveProperty("knowledgeEntries");
    expect(results[0]).toHaveProperty("knowledgeFilters");
    expect(results[0]).toHaveProperty("knowledgeGroups");
  });

  it("should update a complete prompt template with all related data", async () => {
    // First create a template to update
    const initialTemplate = {
      organisationId: TEST_ORGANISATION_1.id,
      name: "Update Test Template",
      category: "test",
      systemPrompt: "Initial system prompt",
      userPrompt: "Initial user prompt with {{placeholder1}}",
      description: "Initial description",
      hidden: false,
      langCode: "en",
      needsInitialCall: false,
      llmOptions: {},
      tools: { enabled: ["tool7"] },
    };

    const initialPlaceholders = [
      {
        name: "placeholder1",
        label: "Placeholder 1",
        description: "First placeholder",
        defaultValue: "default value 1",
        type: "text" as const,
        requiredByUser: true,
        suggestions: ["initial suggestion 1", "initial suggestion 2"],
        promptTemplateId: "",
      },
    ];

    const result = await createFullPromptTemplate({
      ...initialTemplate,
      placeholders: initialPlaceholders,
      knowledgeEntryIds: [knowledgeEntryId],
      knowledgeFilterIds: [knowledgeFilterId],
      knowledgeGroupIds: [knowledgeGroupId],
    });

    const templateId = result.id;

    // Now update the template with new data
    const updatedTemplate = {
      ...initialTemplate,
      id: templateId,
      name: "Updated Test Template",
      systemPrompt: "Updated system prompt",
      userPrompt:
        "Updated user prompt with {{placeholder1}} and {{placeholder2}}",
      description: "Updated description",
    };

    const updatedPlaceholders = [
      {
        id: result.placeholders[0].id,
        promptTemplateId: templateId,
        name: "placeholder1",
        label: "Updated Placeholder 1",
        description: "Updated first placeholder",
        defaultValue: "updated default value 1",
        type: "text" as const,
        requiredByUser: true,
        suggestions: ["updated suggestion 1", "updated suggestion 2"],
      },
      {
        name: "placeholder2",
        label: "New Placeholder 2",
        description: "Second placeholder",
        defaultValue: "default value 2",
        type: "text" as const,
        requiredByUser: true,
        suggestions: ["new suggestion 1", "new suggestion 2"],
        promptTemplateId: templateId,
      },
    ];

    // Create additional test data for the update
    const newKnowledgeEntry = await getDb()
      .insert(knowledgeEntry)
      .values({
        organisationId: TEST_ORGANISATION_1.id,
        name: "New Test Knowledge Entry",
        description: "New test description",
        sourceType: "text",
      })
      .returning();

    const newKnowledgeFilter = await getDb()
      .insert(knowledgeFilters)
      .values({
        organisationId: TEST_ORGANISATION_1.id,
        category: "test",
        name: "New Test Filter",
      })
      .returning();

    const newKnowledgeGroup = await getDb()
      .insert(knowledgeGroup)
      .values({
        organisationId: TEST_ORGANISATION_1.id,
        name: "New Test Group",
        description: "New test group description",
        userId: TEST_ADMIN_USER.id,
        organisationWideAccess: false,
      })
      .returning();

    // Update the template with new data
    const updatedResult = await createFullPromptTemplate(
      {
        ...updatedTemplate,
        placeholders: updatedPlaceholders,
        knowledgeEntryIds: [knowledgeEntryId, newKnowledgeEntry[0].id],
        knowledgeFilterIds: [knowledgeFilterId, newKnowledgeFilter[0].id],
        knowledgeGroupIds: [knowledgeGroupId, newKnowledgeGroup[0].id],
      },
      true // overwrite existing
    );

    // Verify the updates
    expect(updatedResult.name).toBe("Updated Test Template");
    expect(updatedResult.systemPrompt).toBe("Updated system prompt");
    expect(updatedResult.userPrompt).toBe(
      "Updated user prompt with {{placeholder1}} and {{placeholder2}}"
    );
    expect(updatedResult.description).toBe("Updated description");

    // Verify placeholders
    expect(updatedResult.placeholders.length).toBe(2);
    expect(updatedResult.placeholders[0].label).toBe("Updated Placeholder 1");
    expect(updatedResult.placeholders[0].suggestions).toEqual([
      {
        id: expect.any(String),
        value: "updated suggestion 1",
        placeholderId: updatedResult.placeholders[0].id,
      },
      {
        id: expect.any(String),
        value: "updated suggestion 2",
        placeholderId: updatedResult.placeholders[0].id,
      },
    ]);
    expect(updatedResult.placeholders[1].name).toBe("placeholder2");
    expect(updatedResult.placeholders[1].suggestions).toEqual([
      {
        id: expect.any(String),
        value: "new suggestion 1",
        placeholderId: updatedResult.placeholders[1].id,
      },
      {
        id: expect.any(String),
        value: "new suggestion 2",
        placeholderId: updatedResult.placeholders[1].id,
      },
    ]);

    // Verify knowledge entries
    expect(updatedResult.knowledgeEntries.length).toBe(2);
    expect(
      updatedResult.knowledgeEntries.map((ke) => ke.knowledgeEntry.id)
    ).toContain(knowledgeEntryId);
    expect(
      updatedResult.knowledgeEntries.map((ke) => ke.knowledgeEntry.id)
    ).toContain(newKnowledgeEntry[0].id);

    // Verify knowledge filters
    expect(updatedResult.knowledgeFilters.length).toBe(2);
    expect(
      updatedResult.knowledgeFilters.map((kf) => kf.knowledgeFilter.id)
    ).toContain(knowledgeFilterId);
    expect(
      updatedResult.knowledgeFilters.map((kf) => kf.knowledgeFilter.id)
    ).toContain(newKnowledgeFilter[0].id);

    // Verify knowledge groups
    expect(updatedResult.knowledgeGroups.length).toBe(2);
    expect(
      updatedResult.knowledgeGroups.map((kg) => kg.knowledgeGroup.id)
    ).toContain(knowledgeGroupId);
    expect(
      updatedResult.knowledgeGroups.map((kg) => kg.knowledgeGroup.id)
    ).toContain(newKnowledgeGroup[0].id);

    // Clean up the new test data
    await getDb()
      .delete(knowledgeEntry)
      .where(eq(knowledgeEntry.id, newKnowledgeEntry[0].id));
    await getDb()
      .delete(knowledgeFilters)
      .where(eq(knowledgeFilters.id, newKnowledgeFilter[0].id));
    await getDb()
      .delete(knowledgeGroup)
      .where(eq(knowledgeGroup.id, newKnowledgeGroup[0].id));
  });

  afterAll(async () => {
    // Clean up test data
    if (createdTemplateId) {
      deletePromptTemplate(createdTemplateId, TEST_ORGANISATION_1.id);
    }
    getDb()
      .delete(knowledgeEntry)
      .where(eq(knowledgeEntry.id, knowledgeEntryId));
    getDb()
      .delete(knowledgeFilters)
      .where(eq(knowledgeFilters.id, knowledgeFilterId));
    getDb()
      .delete(knowledgeGroup)
      .where(eq(knowledgeGroup.id, knowledgeGroupId));
  });
});
