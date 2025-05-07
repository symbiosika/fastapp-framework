import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../db/db-connection";
import {
  type MCPServerInsert,
  type MCPServerSelect,
  mcpServers,
  mcpTokens,
} from "../../db/db-schema";

/**
 * Create a new MCP server for a user
 */
export async function createMcpServerForUser(
  server: MCPServerInsert
): Promise<MCPServerSelect> {
  const [r] = await getDb().insert(mcpServers).values(server).returning();
  return r;
}

/**
 * Get MCP config for a user
 */
export async function getMcpConfigForUser(
  userId: string,
  mcpServerId: string
): Promise<MCPServerSelect> {
  const [server] = await getDb()
    .select()
    .from(mcpServers)
    .where(and(eq(mcpServers.id, mcpServerId), eq(mcpServers.userId, userId)))
    .limit(1);

  if (!server) throw new Error("Server not found");

  return server;
}

/**
 * Delete MCP server for a user
 */
export async function deleteMcpServerForUser(
  userId: string,
  mcpServerId: string
): Promise<void> {
  await getDb()
    .delete(mcpServers)
    .where(and(eq(mcpServers.id, mcpServerId), eq(mcpServers.userId, userId)));
}

/**
 * Save MCP tokens for a user
 */
export async function saveMcpTokensForUser(
  userId: string,
  serverId: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  }
): Promise<void> {
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  await getDb()
    .insert(mcpTokens)
    .values({
      userId,
      mcpServerId: serverId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt,
      scope: tokens.scope ?? "",
      tokenType: tokens.token_type ?? "Bearer",
    });
}

/**
 * Get a valid access token for a user
 */
export async function getValidAccessToken(
  userId: string,
  mcpServerId: string
): Promise<string> {
  const [token] = await getDb()
    .select()
    .from(mcpTokens)
    .where(
      and(eq(mcpTokens.userId, userId), eq(mcpTokens.mcpServerId, mcpServerId))
    )
    .orderBy(desc(mcpTokens.createdAt))
    .limit(1);

  if (!token) throw new Error("Token not found");

  if (token.expiresAt && new Date() > token.expiresAt) {
    // Token abgelaufen → refreshen
    const [server] = await getDb()
      .select()
      .from(mcpServers)
      .where(eq(mcpServers.id, mcpServerId))
      .limit(1);

    if (!server) throw new Error("Server not found");

    const res = await fetch(server.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken!,
        client_id: server.clientId,
        client_secret: server.clientSecret,
      }),
    });
    if (!res.ok) throw new Error("Failed to refresh token");
    const newTokens = await res.json();

    await saveMcpTokensForUser(userId, mcpServerId, newTokens);
    return newTokens.access_token;
  }

  return token.accessToken;
}
