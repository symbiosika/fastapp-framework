import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineRoutes from ".";
import defineTemplateRoutes from "../template";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_ADMIN_USER,
} from "../../../../../test/init.test";
import { Hono } from "hono";
import type { FastAppHonoContextVariables } from "../../../../../types";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../../../lib/db/db-connection";
import { getDb } from "../../../../../lib/db/db-connection";
import {
  knowledgeEntry,
  knowledgeFilters,
  knowledgeGroup,
} from "../../../../../lib/db/schema/knowledge";
import { eq } from "drizzle-orm";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let createdTemplateId: string;
let testKnowledgeEntryId: string;
let testKnowledgeFilterId: string;
let testKnowledgeGroupId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  defineTemplateRoutes(app, "/api");

  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;

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
  testKnowledgeEntryId = entry[0].id;

  // Create test knowledge filter
  const filter = await getDb()
    .insert(knowledgeFilters)
    .values({
      organisationId: TEST_ORGANISATION_1.id,
      category: "test",
      name: "Test Filter",
    })
    .returning();
  testKnowledgeFilterId = filter[0].id;

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
  testKnowledgeGroupId = group[0].id;
});

describe("Template Relations API Endpoints", () => {
  // First create a template to use in the tests
  test("Create a test template", async () => {
    const templateData = {
      name: "test-template-relations",
      label: "Test Template Relations",
      description: "A test template for relations testing",
      category: "test",
      systemPrompt: "You are a helpful assistant for testing.",
      userPrompt: "Please respond to: {{query}}",
      organisationId: TEST_ORGANISATION_1.id,
      hidden: false,
      needsInitialCall: false,
      llmOptions: {},
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates`,
      TEST_USER_1_TOKEN,
      templateData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.name).toBe(templateData.name);
    expect(response.jsonResponse.id).toBeDefined();

    createdTemplateId = response.jsonResponse.id;
  });

  test("Assign knowledge entries to a prompt template", async () => {
    const knowledgeEntryIds = [testKnowledgeEntryId];

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/knowledge-entries`,
      TEST_USER_1_TOKEN,
      { knowledgeEntryIds }
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.success).toBe(true);
  });

  test("Get knowledge entries assigned to a prompt template", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/knowledge-entries`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(response.jsonResponse.length).toBe(1);
    expect(response.jsonResponse[0].id).toBe(testKnowledgeEntryId);
  });

  test("Assign knowledge filters to a prompt template", async () => {
    const knowledgeFilterIds = [testKnowledgeFilterId];

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/knowledge-filters`,
      TEST_USER_1_TOKEN,
      { knowledgeFilterIds }
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.success).toBe(true);
  });

  test("Get knowledge filters assigned to a prompt template", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/knowledge-filters`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(response.jsonResponse.length).toBe(1);
    expect(response.jsonResponse[0].id).toBe(testKnowledgeFilterId);
  });

  test("Assign knowledge groups to a prompt template", async () => {
    const knowledgeGroupIds = [testKnowledgeGroupId];

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/knowledge-groups`,
      TEST_USER_1_TOKEN,
      { knowledgeGroupIds }
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.success).toBe(true);
  });

  test("Get knowledge groups assigned to a prompt template", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/knowledge-groups`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(response.jsonResponse.length).toBe(1);
    expect(response.jsonResponse[0].id).toBe(testKnowledgeGroupId);
  });

  test("Remove knowledge entries from a prompt template", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/knowledge-entries`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.success).toBe(true);
  });

  test("Remove knowledge filters from a prompt template", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/knowledge-filters`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.success).toBe(true);
  });

  test("Remove knowledge groups from a prompt template", async () => {
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}/knowledge-groups`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.success).toBe(true);
  });

  // Cleanup - delete the test template and test data
  test("Cleanup test data", async () => {
    // Delete the template
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/templates/${createdTemplateId}`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);

    // Delete test knowledge entry
    await getDb()
      .delete(knowledgeEntry)
      .where(eq(knowledgeEntry.id, testKnowledgeEntryId));

    // Delete test knowledge filter
    await getDb()
      .delete(knowledgeFilters)
      .where(eq(knowledgeFilters.id, testKnowledgeFilterId));

    // Delete test knowledge group
    await getDb()
      .delete(knowledgeGroup)
      .where(eq(knowledgeGroup.id, testKnowledgeGroupId));
  });
});
