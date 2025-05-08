import { describe, test, expect, beforeAll } from "bun:test";
import { getMcpEndpoints } from "./discover";
import { initTests } from "../../../test/init.test";

describe("getMcpEndpoints", () => {
  test("should fetch and parse endpoints from Atlassian MCP server", async () => {
    // Use the public Atlassian MCP server for testing
    const mcpServerUrl = "https://mcp.atlassian.com";
    const endpoints = await getMcpEndpoints(mcpServerUrl);

    // Check that required endpoints are present and are strings
    expect(endpoints.authorizationEndpoint).toBeString();
    expect(endpoints.tokenEndpoint).toBeString();

    // Optional endpoints may be present
    if (endpoints.registrationEndpoint) {
      expect(typeof endpoints.registrationEndpoint).toBe("string");
    }
    if (endpoints.revocationEndpoint) {
      expect(typeof endpoints.revocationEndpoint).toBe("string");
    }

    // Supported features should be arrays of strings if present
    if (endpoints.codeChallengeMethodsSupported) {
      expect(Array.isArray(endpoints.codeChallengeMethodsSupported)).toBe(true);
      for (const method of endpoints.codeChallengeMethodsSupported) {
        expect(typeof method).toBe("string");
      }
    }
    if (endpoints.responseTypesSupported) {
      expect(Array.isArray(endpoints.responseTypesSupported)).toBe(true);
      for (const type of endpoints.responseTypesSupported) {
        expect(typeof type).toBe("string");
      }
    }
    if (endpoints.responseModesSupported) {
      expect(Array.isArray(endpoints.responseModesSupported)).toBe(true);
      for (const mode of endpoints.responseModesSupported) {
        expect(typeof mode).toBe("string");
      }
    }
  });
});
