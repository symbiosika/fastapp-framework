import { describe, test, expect, beforeAll } from "bun:test";
import { initTests, TEST_ORGANISATION_1 } from "../../../test/init.test";
import {
  addServerSideStaticTemplate,
  getServerSideStaticTemplates,
} from "./static-templates";

describe("Static Templates", () => {
  test("should add a static template and retrieve it", () => {
    // Create a test template
    const testTemplate = {
      name: "Test Template",
      label: "Test Label",
      description: "Test Description",
      systemPrompt: "Test System Prompt",
      userPrompt: "Test User Prompt",
      category: "system",
      langCode: "en",
      hidden: false,
      needsInitialCall: false,
    };

    // Add the template
    addServerSideStaticTemplate(testTemplate);

    // Get all templates for the organization
    const templates = getServerSideStaticTemplates(TEST_ORGANISATION_1.id);

    // Verify the template was added correctly
    expect(templates).toHaveLength(1);
    expect(templates[0]).toMatchObject({
      name: testTemplate.name,
      label: testTemplate.label,
      description: testTemplate.description,
      systemPrompt: testTemplate.systemPrompt,
      userPrompt: testTemplate.userPrompt,
      category: testTemplate.category,
      langCode: testTemplate.langCode,
      hidden: testTemplate.hidden,
      needsInitialCall: testTemplate.needsInitialCall,
      organisationId: TEST_ORGANISATION_1.id,
    });
  });
});
