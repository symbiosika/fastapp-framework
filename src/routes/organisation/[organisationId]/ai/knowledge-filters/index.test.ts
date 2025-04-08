import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineRoutes from ".";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_USER_1,
} from "../../../../../test/init.test";
import { Hono } from "hono";
import type { FastAppHonoContextVariables } from "../../../../../types";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../../../lib/db/db-connection";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let createdFilterId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
});

describe("Knowledge Filters API Endpoints", () => {
  test("Create a knowledge filter", async () => {
    const filterData = {
      organisationId: TEST_ORGANISATION_1.id,
      category: "department",
      name: "IT",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      TEST_USER_1_TOKEN,
      filterData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.id).toBeDefined();
    createdFilterId = response.jsonResponse.id;
  });

  test("Update a filter's name", async () => {
    const updateData = {
      organisationId: TEST_ORGANISATION_1.id,
      category: "department",
      oldName: "IT",
      newName: "Information Technology",
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters/name`,
      TEST_USER_1_TOKEN,
      updateData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toEqual({ success: true });
  });

  test("Update a filter's category", async () => {
    const updateData = {
      organisationId: TEST_ORGANISATION_1.id,
      oldCategory: "department",
      newCategory: "division",
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters/category`,
      TEST_USER_1_TOKEN,
      updateData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toEqual({ success: true });
  });

  test("Create another filter in the new category", async () => {
    const filterData = {
      organisationId: TEST_ORGANISATION_1.id,
      category: "division",
      name: "HR",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      TEST_USER_1_TOKEN,
      filterData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse.id).toBeDefined();
  });

  test("Update multiple filters in a category", async () => {
    // First create multiple filters in the same category
    const filterData1 = {
      organisationId: TEST_ORGANISATION_1.id,
      category: "status",
      name: "active",
    };

    const filterData2 = {
      organisationId: TEST_ORGANISATION_1.id,
      category: "status",
      name: "inactive",
    };

    await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      TEST_USER_1_TOKEN,
      filterData1
    );

    await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      TEST_USER_1_TOKEN,
      filterData2
    );

    // Then update the category
    const updateData = {
      organisationId: TEST_ORGANISATION_1.id,
      oldCategory: "status",
      newCategory: "state",
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters/category`,
      TEST_USER_1_TOKEN,
      updateData
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toEqual({ success: true });
  });

  test("Should not allow non-admin users to create filters", async () => {
    const filterData = {
      organisationId: TEST_ORGANISATION_1.id,
      category: "test",
      name: "test",
    };

    // Create a non-admin token
    const nonAdminToken = "non-admin-token";

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      nonAdminToken,
      filterData
    );

    expect(response.status).toBe(401);
  });

  test("Should validate organisation ID mismatch", async () => {
    const filterData = {
      organisationId: "wrong-org-id",
      category: "test",
      name: "test",
    };

    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      TEST_USER_1_TOKEN,
      filterData
    );

    expect(response.status).toBe(400);
  });

  test("Get all filters grouped by category", async () => {
    // First create some test filters
    await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      TEST_USER_1_TOKEN,
      {
        organisationId: TEST_ORGANISATION_1.id,
        category: "test-category1",
        name: "filter1",
      }
    );

    await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      TEST_USER_1_TOKEN,
      {
        organisationId: TEST_ORGANISATION_1.id,
        category: "test-category1",
        name: "filter2",
      }
    );

    await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      TEST_USER_1_TOKEN,
      {
        organisationId: TEST_ORGANISATION_1.id,
        category: "test-category2",
        name: "filter3",
      }
    );

    // Get all filters
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    const filters = response.jsonResponse;

    // Verify that our test categories exist with the correct filters
    expect(filters["test-category1"]).toBeDefined();
    expect(filters["test-category1"].length).toBe(2);
    expect(filters["test-category1"][0].name).toBe("filter1");
    expect(filters["test-category1"][1].name).toBe("filter2");
    expect(filters["test-category2"]).toBeDefined();
    expect(filters["test-category2"].length).toBe(1);
    expect(filters["test-category2"][0].name).toBe("filter3");
  });

  test("Delete a filter", async () => {
    // First create a filter to delete
    const createResponse = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      TEST_USER_1_TOKEN,
      {
        organisationId: TEST_ORGANISATION_1.id,
        category: "delete-test",
        name: "to-delete",
      }
    );

    expect(createResponse.status).toBe(200);

    // Delete the filter
    const deleteResponse = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters?category=delete-test&name=to-delete&organisationId=${TEST_ORGANISATION_1.id}`,
      TEST_USER_1_TOKEN
    );

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.jsonResponse).toEqual({ success: true });

    // Verify the filter was deleted by getting all filters
    const getResponse = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters`,
      TEST_USER_1_TOKEN
    );

    expect(getResponse.status).toBe(200);
    expect(getResponse.jsonResponse["delete-test"]).toBeUndefined();
  });

  test("Should not allow non-admin users to delete filters", async () => {
    // Create a non-admin token
    const nonAdminToken = "non-admin-token";

    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/knowledge-filters?category=test&name=test&organisationId=${TEST_ORGANISATION_1.id}`,
      nonAdminToken
    );

    expect(response.status).toBe(401);
  });
});
