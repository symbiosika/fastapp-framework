import { describe, test, expect, beforeAll } from "bun:test";
import { testFetcher } from "../../../../../test/fetcher.test";
import defineRoutes from ".";
import {
  initTests,
  TEST_ORGANISATION_1,
  TEST_ORGANISATION_2,
} from "../../../../../test/init.test";
import { Hono } from "hono";
import type { FastAppHonoContextVariables } from "../../../../../types";
import { rejectUnauthorized } from "../../../../../test/reject-unauthorized.test";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "../../../../../lib/db/db-connection";

let app = new Hono<{ Variables: FastAppHonoContextVariables }>();
let TEST_USER_1_TOKEN: string;
let TEST_USER_2_TOKEN: string;
let createdTemplateId: string;

beforeAll(async () => {
  await createDatabaseClient();
  await waitForDbConnection();

  defineRoutes(app, "/api");
  const { user1Token, user2Token } = await initTests();
  TEST_USER_1_TOKEN = user1Token;
  TEST_USER_2_TOKEN = user2Token;
});

describe("Prompt Templates API Security Tests", () => {
  test("Endpoints should reject unauthorized requests", async () => {
    await rejectUnauthorized(app, [
      ["GET", `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`],
      [
        "POST",
        `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`,
      ],
    ]);
  });

  test("User cannot access prompt snippets in another organisation", async () => {
    // User 2 tries to access organisation 1's prompt snippets
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`,
      TEST_USER_2_TOKEN
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });

  test("User cannot create prompt snippet in another organisation", async () => {
    const snippetData = {
      name: "malicious-snippet",
      content: "This is a malicious snippet.",
      category: "security-test",
      organisationId: TEST_ORGANISATION_1.id,
    };

    // User 2 tries to create a snippet in organisation 1
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/ai/prompt-snippets`,
      TEST_USER_2_TOKEN,
      snippetData
    );

    // Should be rejected due to organisation permission check
    expect(response.status).toBe(403);
  });
});
