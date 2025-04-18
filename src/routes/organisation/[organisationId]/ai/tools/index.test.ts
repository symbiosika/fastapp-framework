import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineToolsRoutes from ".";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_ORGANISATION_2,
  TEST_USER_1,
} from "../../../../../test/init.test";
import { Hono } from "hono";
import type { FastAppHonoContextVariables } from "../../../../../types";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let TEST_USER_2_TOKEN: string;

beforeAll(async () => {
  defineToolsRoutes(app, "/api");
  const { user1Token, user2Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
  TEST_USER_2_TOKEN = user2Token;
});

describe("AI Tools API Endpoints", () => {
  test("Get available tools for an organisation", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/tools/available`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(200);
    expect(response.jsonResponse).toBeDefined();
    expect(Array.isArray(response.jsonResponse.tools)).toBe(true);

    // Check if tools have the correct structure
    const tools = response.jsonResponse.tools;
    if (tools.length > 0) {
      const tool = tools[0];
      expect(tool).toHaveProperty("name");
      expect(tool).toHaveProperty("label");
      expect(tool).toHaveProperty("description");
    }
  });

  test("Unauthorized user cannot access tools", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/tools/available`,
      "invalid-token"
    );

    expect(response.status).toBe(401);
  });

  test("User cannot access tools from another organisation", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/tools/available`,
      TEST_USER_2_TOKEN
    );

    expect(response.status).toBe(403);
    expect(response.textResponse).toContain(
      "User is not a member of this organisation"
    );
  });

  test("Invalid organisation ID returns error", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/invalid-org-id/ai/tools/available`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(403);
  });

  test("Missing organisation ID returns error", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation//ai/tools/available`,
      TEST_USER_1_TOKEN
    );

    expect(response.status).toBe(404);
  });
});
