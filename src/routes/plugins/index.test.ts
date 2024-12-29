import { describe, it, expect, beforeAll } from "bun:test";
import { Hono } from "hono";
import definePluginRoutes from ".";
import type { FastAppHono } from "../../types";
import { initTests, TEST_ORGANISATION_ID } from "../../test/init.test";
import { registerServerPlugin } from "../../lib/plugins";
import type { ServerPlugin } from "../../lib/types/plugins";

describe("Plugin API Endpoints", () => {
  let createdPlugin: any;

  const app: FastAppHono = new Hono();
  let jwt: string;
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
    const { token } = await initTests();
    jwt = token;
    definePluginRoutes(app, "/api");
    // Register the mock plugin
    registerServerPlugin(mockPlugin);

    await app.request(
      `/api/plugins/organisation/${TEST_ORGANISATION_ID}/installed/test-plugin`,
      {
        method: "DELETE",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );
  });
  // Test getting available plugins
  it("should list available plugins", async () => {
    const response = await app.request("/api/plugins/available", {
      method: "GET",
      headers: {
        Cookie: `jwt=${jwt}`,
      },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((p: any) => p.name === "test-plugin")).toBe(true);
  });
  // Test plugin creation with invalid parameters
  it("should reject invalid plugin creation", async () => {
    const invalidPlugin = {
      name: "test-plugin",
      description: "Test plugin",
      pluginType: "test-plugin",
      version: 1,
      meta: {
        // Missing required parameter
      },
    };
    const response = await app.request(
      `/api/plugins/organisation/${TEST_ORGANISATION_ID}/installed`,
      {
        method: "POST",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
        body: JSON.stringify(invalidPlugin),
      }
    );
    expect(response.status).toBe(400);
  });
  // Test successful plugin creation
  it("should create a new plugin", async () => {
    const validPlugin = {
      organisationId: TEST_ORGANISATION_ID,
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
    const response = await app.request(
      `/api/plugins/organisation/${TEST_ORGANISATION_ID}/installed`,
      {
        method: "POST",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
        body: JSON.stringify(validPlugin),
      }
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    createdPlugin = data;
    expect(data.name).toBe("test-plugin");
    expect(data.meta.testSecret).toBeDefined();
    expect(data.meta.testSecret.id).toBeDefined();
    return data; // Modified to return entire data object
  });
  // Test getting installed plugins
  it("should list installed plugins", async () => {
    const response = await app.request(
      `/api/plugins/organisation/${TEST_ORGANISATION_ID}/installed`,
      {
        method: "GET",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((p: any) => p.name === "test-plugin")).toBe(true);
  });
  //   // Test updating plugin configuration
  it("should update plugin configuration", async () => {
    const updatedConfig = {
      id: createdPlugin.id,
      organisationId: TEST_ORGANISATION_ID,
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

    const response = await app.request(
      `/api/plugins/organisation/${TEST_ORGANISATION_ID}/installed/${createdPlugin.id}`,
      {
        method: "PUT",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
        body: JSON.stringify(updatedConfig),
      }
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.description).toBe("Updated description");
    expect(data.meta.testParam.value).toBe("updated value");
  });
  // Test getting single plugin
  it("should get single plugin by ID", async () => {
    const listResponse = await app.request(
      `/api/plugins/organisation/${TEST_ORGANISATION_ID}/installed`,
      {
        method: "GET",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );
    const plugins = await listResponse.json();
    const testPlugin = plugins.find((p: any) => p.name === "test-plugin");
    const response = await app.request(
      `/api/plugins/organisation/${TEST_ORGANISATION_ID}/installed/${testPlugin.id}`,
      {
        method: "GET",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("test-plugin");
  });
  // Test deleting plugin
  it("should delete plugin", async () => {
    const listResponse = await app.request(
      `/api/plugins/organisation/${TEST_ORGANISATION_ID}/installed`,
      {
        method: "GET",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );
    const plugins = await listResponse.json();
    const testPlugin = plugins.find((p: any) => p.name === "test-plugin");
    const response = await app.request(
      `/api/plugins/organisation/${TEST_ORGANISATION_ID}/installed/${testPlugin.id}`,
      {
        method: "DELETE",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );
    expect(response.status).toBe(200);
    // Verify deletion
    const verifyResponse = await app.request(
      `/api/plugins/organisation/${TEST_ORGANISATION_ID}/installed/${testPlugin.id}`,
      {
        method: "GET",
        headers: {
          Cookie: `jwt=${jwt}`,
        },
      }
    );
    expect(verifyResponse.status).toBe(400);
  });
});
