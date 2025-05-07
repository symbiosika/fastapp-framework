/**
 * Routes to manage AI provider models of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 * Write operations require organisation admin rights
 */

import { HTTPException } from "../../../../../types";
import type { FastAppHono } from "../../../../../types";
import * as v from "valibot";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/valibot";
import { isOrganisationMember } from "../../..";
import { _GLOBAL_SERVER_CONFIG } from "../../../../../store";
import { log } from "../../../../..";
import { sign } from "jsonwebtoken";
import { authAndSetUsersInfo } from "../../../../../lib/utils/hono-middlewares";
import {
  getMcpConfigForUser,
  saveMcpTokensForUser,
} from "../../../../../lib/ai/mcp/crud";


/*

https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization
/.well-known/oauth-authorization-server
https://mcp.atlassian.com/.well-known/oauth-authorization-server


{
  "issuer": "https://atlassian-remote-mcp-production.atlassian-remote-mcp-server-production.workers.dev",
  "authorization_endpoint": "https://mcp.atlassian.com/v1/authorize",
  "token_endpoint": "https://atlassian-remote-mcp-production.atlassian-remote-mcp-server-production.workers.dev/v1/token",
  "registration_endpoint": "https://atlassian-remote-mcp-production.atlassian-remote-mcp-server-production.workers.dev/v1/register",
  "response_types_supported": [
    "code"
  ],
  "response_modes_supported": [
    "query"
  ],
  "grant_types_supported": [
    "authorization_code",
    "refresh_token"
  ],
  "token_endpoint_auth_methods_supported": [
    "client_secret_basic",
    "client_secret_post",
    "none"
  ],
  "revocation_endpoint": "https://atlassian-remote-mcp-production.atlassian-remote-mcp-server-production.workers.dev/v1/token",
  "code_challenge_methods_supported": [
    "plain",
    "S256"
  ]
}

 */

/**
 * Define the AI provider models management routes
 */
export default function defineModelRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * MCP Start Auth Flow
   */
  app.post(
    API_BASE_PATH + "/organisation/ai/mcp/start",
    authAndSetUsersInfo,
    describeRoute({
      method: "post",
      path: "/organisation/ai/mcp/start",
      tags: ["ai", "mcp"],
      summary: "MCP Start Auth Flow",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "json",
      v.object({
        mcpServerId: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { mcpServerId } = c.req.valid("json");
        const userId = c.get("usersId");

        const mcpConfig = await getMcpConfigForUser(userId, mcpServerId);

        const state = await sign({ mcpConfig, userId: userId }, "secret");

        const authorizeUrl =
          `${mcpConfig.authorizeUrl}?` +
          new URLSearchParams({
            response_type: "code",
            client_id: mcpConfig.clientId,
            redirect_uri: `${_GLOBAL_SERVER_CONFIG.baseUrl}/organisation/ai/mcp`,
            state,
            scope: "mcp.read mcp.write", // TO BE CHANGED!
          });

        return c.json({ authorizeUrl });
      } catch (error) {
        throw new HTTPException(500, {
          message: error + "",
        });
      }
    }
  );

  /**
   * MCP Auth Callback
   */
  app.get(
    API_BASE_PATH + "/organisation//ai/mcp",
    describeRoute({
      method: "get",
      path: "/organisation/ai/mcp",
      tags: ["ai", "mcp"],
      summary: "MCP Auth Callback",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator("query", v.object({ code: v.string(), state: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const { code, state } = c.req.valid("query");
        const { mcpConfig, userId } = JSON.parse(state); // Aus Sicherheitsgründen vorher in JWT packen!

        // Token anfordern
        const request = {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: `${_GLOBAL_SERVER_CONFIG.baseUrl}/organisation/ai/mcp`,
            client_id: mcpConfig.clientId,
            client_secret: mcpConfig.clientSecret,
          }),
        };
        log.debug("MCP Auth Callback", request);
        const response = await fetch(mcpConfig.tokenUrl, request);

        const tokens = await response.json();

        // Tokens sicher speichern, z.B. in DB
        await saveMcpTokensForUser(userId, mcpConfig.baseUrl, tokens);

        return c.redirect("/");
      } catch (error) {
        throw new HTTPException(500, {
          message: error + "",
        });
      }
    }
  );
}
