import { describe, test, expect, beforeAll } from "bun:test";
import { Hono } from "hono";
import definePluginRoutes from ".";
import type { FastAppHono } from "../../../../types";
import {
  getJwtTokenForTesting,
  initTests,
  TEST_ORGANISATION_1,
  TEST_ORGANISATION_2,
} from "../../../../test/init.test";
import { registerServerPlugin } from "../../../../lib/plugins";
import type { ServerPlugin } from "../../../../lib/types/plugins";
import { testFetcher } from "../../../../test/fetcher.test";
import { rejectUnauthorized } from "../../../../test/reject-unauthorized.test";

describe("Plugin Security Tests", () => {
  const app: FastAppHono = new Hono();
  let user1Token: string;
  let user2Token: string;

  // Define a mock plugin for testing
  const mockPlugin: ServerPlugin = {
    name: "test-plugin",
    label: "Test Plugin",
    description: "A test plugin",
    version: 1,
    neededParameters: [],
  };

  beforeAll(async () => {
    await initTests();
    user1Token = await getJwtTokenForTesting(1);
    user2Token = await getJwtTokenForTesting(2);
    definePluginRoutes(app, "/api");
    // Register the mock plugin
    registerServerPlugin(mockPlugin);
  });

  test("should reject access to plugins from other organisations", async () => {
    // User 1 creates a plugin
    const validPlugin = {
      organisationId: TEST_ORGANISATION_1.id,
      name: "test-plugin",
      description: "Test plugin",
      pluginType: "test-plugin",
      version: 1,
      meta: {},
    };
    await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed`,
      user1Token,
      validPlugin
    );

    // User 2 tries to access the plugin
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed`,
      user2Token
    );
    expect(response.status).toBe(403);
  });

  test("should reject requests without a token", async () => {
    rejectUnauthorized(app, [
      ["GET", `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed`],
      ["POST", `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed`],
      ["PUT", `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed/some-id`],
      [
        "DELETE",
        `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed/some-id`,
      ],
    ]);
  });
});
