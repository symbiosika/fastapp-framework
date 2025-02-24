import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../test/fetcher.test";
import defineWorkspaceRoutes from "./index";
import {
  getJwtTokenForTesting,
  initTests,
  TEST_ORGANISATION_1,
} from "../../../../test/init.test";
import { Hono } from "hono";
import type { FastAppHonoContextVariables } from "../../../../types";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db/db-connection";
import { workspaces } from "../../../../lib/db/db-schema";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let TEST_USER_2_TOKEN: string;
let TEST_USER_3_TOKEN: string;

beforeAll(async () => {
  defineWorkspaceRoutes(app, "/api");
  await initTests();
  TEST_USER_1_TOKEN = await getJwtTokenForTesting(0);
  TEST_USER_2_TOKEN = await getJwtTokenForTesting(1);
  TEST_USER_3_TOKEN = await getJwtTokenForTesting(2);
  getDb()
    .delete(workspaces)
    .where(
      and(
        eq(workspaces.organisationId, TEST_ORGANISATION_1.id),
        eq(workspaces.userId, TEST_USER_1_TOKEN)
      )
    );
});

describe("Workspace API Endpoints", () => {
  test("Sequential Workspace Operations", async () => {
    console.log("Testing sequential workspace operations...");

    console.log("Adding new workspace...");
    let response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces`,
      TEST_USER_1_TOKEN,
      { name: "New Workspace", organisationId: TEST_ORGANISATION_1.id }
    );
    expect(response.status).toBe(200);
    let data = await response.json();
    const addedWorkspace = data.id;
    console.log("Added workspace:", addedWorkspace);
    expect(data.name).toBe("New Workspace");

    console.log("Getting all workspaces...");
    response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces`,
      TEST_USER_1_TOKEN
    );
    expect(response.status).toBe(200);
    data = await response.json();
    expect(Array.isArray(data)).toBe(true);

    console.log("Updating workspace...");
    response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${addedWorkspace}`,
      TEST_USER_1_TOKEN,
      { name: "Updated Workspace", organisationId: TEST_ORGANISATION_1.id }
    );
    expect(response.status).toBe(200);
    data = await response.json();
    expect(data.name).toBe("Updated Workspace");

    console.log("Deleting workspace...");
    response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${addedWorkspace}`,
      TEST_USER_1_TOKEN
    );
    expect(response.status).toBe(200);

    console.log("Unauthorized delete attempt...");
    response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${addedWorkspace}`,
      TEST_USER_2_TOKEN
    );
    expect(response.status).toBe(500);
    const errorData = await response.text();
    expect(errorData).toContain(
      "Failed to delete workspace. Error: User does not have permission to access workspace"
    );
  });
});
