import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../test/fetcher.test";
import defineWorkspaceRoutes from "./index";
import {
  getJwtTokenForTesting,
  initTests,
  TEST_ORGANISATION_1,
  TEST_USER_1,
  TEST_USER_2,
  TEST_USER_3,
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
    let data = response.jsonResponse;
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
    data = response.jsonResponse;
    expect(Array.isArray(data)).toBe(true);

    console.log("Updating workspace...");
    response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${addedWorkspace}`,
      TEST_USER_1_TOKEN,
      { name: "Updated Workspace", organisationId: TEST_ORGANISATION_1.id }
    );
    expect(response.status).toBe(200);
    data = response.jsonResponse;
    expect(data.name).toBe("Updated Workspace");

    console.log("Unauthorized delete attempt...");
    response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${addedWorkspace}`,
      TEST_USER_2_TOKEN
    );
    expect(response.status).toBe(500);
    expect(response.textResponse).toContain(
      "Failed to delete workspace. Error: User does not have permission to access workspace"
    );

    console.log("Unauthorized GET attempt...");
    response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${addedWorkspace}`,
      TEST_USER_2_TOKEN
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(500);
    expect(response.textResponse).toContain(
      "User does not have permission to access workspace"
    );

    console.log("Unauthorized update attempt...");
    response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${addedWorkspace}`,
      TEST_USER_2_TOKEN,
      { name: "Unauthorized Update", organisationId: TEST_ORGANISATION_1.id }
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(500);
    expect(response.textResponse).toContain(
      "User does not have permission to update workspace"
    );

    console.log("Deleting workspace...");
    response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${addedWorkspace}`,
      TEST_USER_1_TOKEN
    );
    expect(response.status).toBe(200);
  });

  test("Complex Workspace Operations", async () => {
    console.log("Adding first workspace...");
    let response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces`,
      TEST_USER_1_TOKEN,
      { name: "Parent Workspace", organisationId: TEST_ORGANISATION_1.id }
    );
    expect(response.status).toBe(200);
    let data = response.jsonResponse;
    const parentWorkspaceId = data.id;
    // console.log("Added parent workspace:", parentWorkspaceId);

    console.log("Adding second workspace with parentId...");
    response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces`,
      TEST_USER_1_TOKEN,
      {
        name: "Child Workspace",
        organisationId: TEST_ORGANISATION_1.id,
        parentId: parentWorkspaceId,
      }
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(200);
    data = response.jsonResponse;
    const childWorkspaceId = data.id;
    console.log("Added child workspace:", childWorkspaceId);

    console.log("Checking access for unpermitted user...");
    response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${childWorkspaceId}`,
      TEST_USER_2_TOKEN
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(500);
    expect(response.textResponse).toContain(
      "User does not have permission to access workspace"
    );

    console.log("Trying to add members without permission...");
    response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${childWorkspaceId}/members`,
      TEST_USER_2_TOKEN,
      { userIds: [TEST_USER_3.id] }
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(500);
    expect(response.textResponse).toContain(
      "Only workspace owner can add users"
    );

    console.log("Adding members with permission...");
    response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${childWorkspaceId}/members`,
      TEST_USER_1_TOKEN,
      { userIds: [TEST_USER_3.id] }
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(200);

    console.log("Checking if member can access workspace...");
    response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${childWorkspaceId}`,
      TEST_USER_3_TOKEN
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(200);

    console.log("User 3 dropping member 1...");
    response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${childWorkspaceId}/members/${TEST_USER_1.id}`,
      TEST_USER_3_TOKEN
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(200);

    console.log("Checking if user 1 can no longer access...");
    response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${childWorkspaceId}`,
      TEST_USER_1_TOKEN
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(500);
    expect(response.textResponse).toContain(
      "User does not have permission to access workspace"
    );

    console.log("Try to drop user 3 from workspace. Should fail...");
    response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${childWorkspaceId}/members/${TEST_USER_3.id}`,
      TEST_USER_3_TOKEN
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(500);
    expect(response.textResponse).toContain(
      "Cannot remove all members from a workspace"
    );

    console.log("Checking origin of workspaces...");
    response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${childWorkspaceId}/origin`,
      TEST_USER_3_TOKEN
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(200);
    data = response.jsonResponse;
    expect(data.list.length).toBe(2);
    expect(
      data.list.some((ws: { id: string }) => ws.id === parentWorkspaceId)
    ).toBe(true);
    expect(
      data.list.some((ws: { id: string }) => ws.id === childWorkspaceId)
    ).toBe(true);

    console.log("Deleting child workspace...");
    response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${childWorkspaceId}`,
      TEST_USER_3_TOKEN
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(200);

    console.log("Deleting parent workspace...");
    response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/workspaces/${parentWorkspaceId}`,
      TEST_USER_1_TOKEN
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(200);
  });
});
