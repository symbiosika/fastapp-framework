import { describe, test, expect, beforeAll } from "bun:test";
import { Hono } from "hono";
import defineSearchInOrganisationRoutes from ".";
import type { FastAppHono } from "../../../../types";
import {
  getJwtTokenForTesting,
  initTests,
  TEST_ORGANISATION_1,
  TEST_ORGANISATION_2,
  TEST_USER_1,
  TEST_USER_2,
} from "../../../../test/init.test";
import { testFetcher } from "../../../../test/fetcher.test";

const userOrg1Token = await getJwtTokenForTesting(1);
const userOrg2Token = await getJwtTokenForTesting(2);
const app: FastAppHono = new Hono();

describe("Search API Endpoints", () => {
  beforeAll(async () => {
    await initTests();
    defineSearchInOrganisationRoutes(app, "/api");
  });

  // Test searching for a user by email
  test("should find TEST_USER_1 in ORGANISATION_1", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/search/user?email=${TEST_USER_1.email}`,
      userOrg1Token
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(200);
    expect(response.jsonResponse?.email).toBe(TEST_USER_1.email);
  });

  // Test searching for a user not in the organisation
  test("should not find TEST_USER_1 in ORGANISATION_2", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/search/user?email=${TEST_USER_1.email}`,
      userOrg2Token
    );
    console.log(response.textResponse);
    expect(response.status).toBe(403);
    expect(response.textResponse).toContain(
      "User is not a member of this organisation"
    );
  });

  // Test unauthorized access
  test("should not allow unauthorized access to search", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/search/user?email=${TEST_USER_1.email}`,
      undefined
    );
    // console.log(response.textResponse);
    expect(response.status).toBe(401); // Assuming 401 Unauthorized for missing token
  });
});
