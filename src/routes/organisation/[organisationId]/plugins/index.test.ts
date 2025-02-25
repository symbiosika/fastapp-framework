import { describe, test, expect, beforeAll } from "bun:test";
import { Hono } from "hono";
import definePluginRoutes from ".";
import type { FastAppHono } from "../../../../types";
import {
  getJwtTokenForTesting,
  initTests,
  TEST_ORGANISATION_1,
} from "../../../../test/init.test";
import { registerServerPlugin } from "../../../../lib/plugins";
import type { ServerPlugin } from "../../../../lib/types/plugins";
import { testFetcher } from "../../../../test/fetcher.test";

describe("Plugin API Endpoints", () => {
  let createdPlugin: any;

  const app: FastAppHono = new Hono();
  let user1Token: string;
  // Define a mock plugin for testing
  const mockPlugin: ServerPlugin = {
    name: "test-plugin",
    label: "Test Plugin",
    description: "A test plugin",
    version: 1,
    neededParameters: [
      {
        category: "general",
        type: "string",
        name: "testParam",
        label: "Test Parameter",
        description: "A test parameter",
      },
      {
        category: "security",
        type: "secret",
        name: "testSecret",
        label: "Test Secret",
        description: "A test secret parameter",
      },
    ],
  };

  beforeAll(async () => {
    await initTests();
    user1Token = await getJwtTokenForTesting(1);
    definePluginRoutes(app, "/api");
    // Register the mock plugin
    registerServerPlugin(mockPlugin);

    await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed/test-plugin`,
      user1Token
    );
  });

  // Test getting available plugins
  test("should list available plugins", async () => {
    const response = await testFetcher.get(
      app,
      "/api/organisation/" + TEST_ORGANISATION_1.id + "/plugins/available",
      user1Token
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(
      response.jsonResponse.some((p: any) => p.name === "test-plugin")
    ).toBe(true);
  });

  // Test plugin creation with invalid parameters
  test("should reject invalid plugin creation", async () => {
    const invalidPlugin = {
      name: "test-plugin",
      description: "Test plugin",
      pluginType: "test-plugin",
      version: 1,
      meta: {
        // Missing required parameter
      },
    };
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed`,
      user1Token,
      invalidPlugin
    );
    expect(response.status).toBe(400);
  });

  // Test successful plugin creation
  test("should create a new plugin", async () => {
    const validPlugin = {
      organisationId: TEST_ORGANISATION_1.id,
      name: "test-plugin",
      description: "Test plugin",
      pluginType: "test-plugin",
      version: 1,
      meta: {
        testParam: {
          type: "string",
          value: "test value",
        },
        testSecret: {
          type: "secret",
          inputValue: "secret value",
        },
      },
    };
    const response = await testFetcher.post(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed`,
      user1Token,
      validPlugin
    );
    expect(response.status).toBe(200);
    createdPlugin = response.jsonResponse;
    expect(createdPlugin.name).toBe("test-plugin");
    expect(createdPlugin.meta.testSecret).toBeDefined();
    expect(createdPlugin.meta.testSecret.id).toBeDefined();
    return createdPlugin; // Modified to return entire data object
  });

  // Test getting installed plugins
  test("should list installed plugins", async () => {
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed`,
      user1Token
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.jsonResponse)).toBe(true);
    expect(
      response.jsonResponse.some((p: any) => p.name === "test-plugin")
    ).toBe(true);
  });

  //   // Test updating plugin configuration
  test("should update plugin configuration", async () => {
    const updatedConfig = {
      id: createdPlugin.id,
      organisationId: TEST_ORGANISATION_1.id,
      name: "test-plugin",
      description: "Updated description",
      pluginType: "test-plugin",
      version: 1,
      meta: {
        testParam: {
          type: "string",
          value: "updated value",
        },
        testSecret: {
          type: "secret",
          id: createdPlugin.meta.testSecret.id,
        },
      },
    };

    const response = await testFetcher.put(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed/${createdPlugin.id}`,
      user1Token,
      updatedConfig
    );
    expect(response.status).toBe(200);
    expect(response.jsonResponse.description).toBe("Updated description");
    expect(response.jsonResponse.meta.testParam.value).toBe("updated value");
  });

  // Test getting single plugin
  test("should get single plugin by ID", async () => {
    const listResponse = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed`,
      user1Token
    );
    const plugins = listResponse.jsonResponse;
    const testPlugin = plugins.find((p: any) => p.name === "test-plugin");
    const response = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed/${testPlugin.id}`,
      user1Token
    );
    expect(response.status).toBe(200);
    expect(response.jsonResponse.name).toBe("test-plugin");
  });
  // Test deleting plugin
  test("should delete plugin", async () => {
    const listResponse = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed`,
      user1Token
    );
    const plugins = listResponse.jsonResponse;
    const testPlugin = plugins.find((p: any) => p.name === "test-plugin");
    const response = await testFetcher.delete(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed/${testPlugin.id}`,
      user1Token
    );
    expect(response.status).toBe(200);
    // Verify deletion
    const verifyResponse = await testFetcher.get(
      app,
      `/api/organisation/${TEST_ORGANISATION_1.id}/plugins/installed/${testPlugin.id}`,
      user1Token
    );
    expect(verifyResponse.status).toBe(400);
  });
});
