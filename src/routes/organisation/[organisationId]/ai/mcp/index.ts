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
import { getMcpEndpoints } from "../../../../../lib/ai/mcp/discover";

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
  app.get(
    API_BASE_PATH + "/oauth/start/:mcpServerId",
    authAndSetUsersInfo,
    describeRoute({
      method: "get",
      path: "/oauth/start/:mcpServerId",
      tags: ["ai", "mcp"],
      summary: "MCP Start Auth Flow",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validator(
      "param",
      v.object({
        mcpServerId: v.string(),
      })
    ),
    async (c) => {
      try {
        const { mcpServerId } = c.req.valid("param");
        const userId = c.get("usersId");

        const mcpConfig = await getMcpConfigForUser(userId, mcpServerId);
        const state = await sign({ mcpConfig, userId: userId }, "secret");
        const endpoints = await getMcpEndpoints(mcpConfig.mcpServerUrl);

        const authorizeUrl =
          endpoints.authorizationEndpoint +
          "?" +
          new URLSearchParams({
            response_type: "code",
            client_id: mcpConfig.clientId,
            redirect_uri: `${_GLOBAL_SERVER_CONFIG.baseUrl}${API_BASE_PATH}/oauth/callback`,
            state,
            scope: "read:me", // TO BE CHANGED!
          });

        log.debug("authorizeUrl", authorizeUrl);
        // return c.redirect(authorizeUrl);
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
    API_BASE_PATH + "/oauth/callback",
    describeRoute({
      method: "get",
      path: "/oauth/callback",
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
        log.debug("MCP Auth Callback", { code, state });

        const { mcpConfig, userId } = JSON.parse(state); // Aus Sicherheitsgründen vorher in JWT packen!
        log.debug("MCP Auth Callback", { mcpConfig, userId });

        // Get Access Token
        const request = {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: `${_GLOBAL_SERVER_CONFIG.baseUrl}${API_BASE_PATH}/oauth/callback`,
            client_id: mcpConfig.clientId,
            client_secret: mcpConfig.clientSecret,
          }),
        };
        log.debug("MCP Auth Callback", request);
        const response = await fetch(mcpConfig.tokenEndpoint, request);

        if (!response.ok) {
          throw new HTTPException(500, {
            message:
              "Failed to get access token." +
              (await response.text()) +
              " " +
              JSON.stringify(request),
          });
        }
        const tokens = await response.json();

        // Tokens sicher speichern, z.B. in DB
        await saveMcpTokensForUser(userId, mcpConfig.mcpServerUrl, tokens);
        log.debug("MCP Auth Callback", { tokens });

        return c.redirect("/");
      } catch (error) {
        throw new HTTPException(500, {
          message: error + "",
        });
      }
    }
  );
}
