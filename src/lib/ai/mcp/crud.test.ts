import { test, expect, beforeAll, describe } from "bun:test";
import {
  createMcpServerForUser,
  getMcpConfigForUser,
  deleteMcpServerForUser,
  saveMcpTokensForUser,
  getValidAccessToken,
} from "./crud";
import {
  initTests,
  TEST_ORG1_USER_1,
  TEST_ORGANISATION_1,
  TEST_ORG1_USER_2,
} from "../../../test/init.test";
import { getDb } from "../../db/db-connection";
import { mcpServers, mcpTokens } from "../../db/db-schema";
import { eq } from "drizzle-orm";

// Shared variables for state between steps
let testServerId: string;
let testTokenId: string;
let server2Id: string;

beforeAll(async () => {
  await initTests();
});

describe("MCP CRUD", () => {
  test("MCP CRUD: create", async () => {
    // Create a new MCP server for a user
    const server = await createMcpServerForUser({
      userId: TEST_ORG1_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id,
      name: "Test MCP Server",
      baseUrl: "https://example.com",
      clientId: "client-id",
      clientSecret: "client-secret",
      authorizeUrl: "https://example.com/auth",
      tokenUrl: "https://example.com/token",
    });
    expect(server).toBeDefined();
    expect(server.userId).toBe(TEST_ORG1_USER_1.id);
    testServerId = server.id;
  });

  test("MCP CRUD: read", async () => {
    // Fetch the created MCP server
    const fetched = await getMcpConfigForUser(
      TEST_ORG1_USER_1.id,
      testServerId
    );
    expect(fetched).toBeDefined();
    expect(fetched.id).toBe(testServerId);
  });

  test("MCP CRUD: delete", async () => {
    await deleteMcpServerForUser(TEST_ORG1_USER_1.id, testServerId);
  });

  test("MCP CRUD: ensure deleted server is not found", async () => {
    await expect(
      getMcpConfigForUser(TEST_ORG1_USER_1.id, testServerId)
    ).rejects.toThrow("Server not found");
  });

  test("MCP CRUD: create token", async () => {
    // Re-create server for token tests
    const server2 = await createMcpServerForUser({
      userId: TEST_ORG1_USER_2.id,
      organisationId: TEST_ORGANISATION_1.id,
      name: "Token Test Server",
      baseUrl: "https://example.com",
      clientId: "client-id",
      clientSecret: "client-secret",
      authorizeUrl: "https://example.com/auth",
      tokenUrl: "https://example.com/token",
    });
    expect(server2).toBeDefined();
    server2Id = server2.id;
  });

  test("MCP CRUD: save token", async () => {
    await saveMcpTokensForUser(TEST_ORG1_USER_2.id, server2Id, {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      expires_in: 3600,
      scope: "read write",
      token_type: "Bearer",
    });
  });

  test("MCP CRUD: read token", async () => {
    const [token] = await getDb()
      .select()
      .from(mcpTokens)
      .where(eq(mcpTokens.userId, TEST_ORG1_USER_2.id));
    expect(token).toBeDefined();
    expect(token.accessToken).toBe("access-token-123");
    testTokenId = token.id;
  });
});

describe("MCP CRUD: get valid access token", () => {
  test("MCP CRUD: get valid access token", async () => {
    const [tokenRow] = await getDb()
      .select()
      .from(mcpTokens)
      .where(eq(mcpTokens.id, testTokenId));
    expect(tokenRow).toBeDefined();
    const accessToken = await getValidAccessToken(
      tokenRow.userId,
      tokenRow.mcpServerId
    );
    expect(accessToken).toBe(tokenRow.accessToken);
  });

  test("MCP CRUD: cleanup", async () => {
    await getDb()
      .delete(mcpTokens)
      .where(eq(mcpTokens.userId, TEST_ORG1_USER_2.id));
    await getDb()
      .delete(mcpServers)
      .where(eq(mcpServers.userId, TEST_ORG1_USER_2.id));
  });
});
