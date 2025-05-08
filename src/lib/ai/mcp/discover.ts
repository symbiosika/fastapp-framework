/*
Specs: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization

Each MCP server has a discovery endpoint that returns the following JSON:
<base-url>/.well-known/oauth-authorization-server

Result:
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
 * Get endpoints for MCP server
 * Will get the MCP server address.
 * Needs to extract the base url from the MCP server url first and then try to
 * get the endpoints from the discovery endpoint.
 */
export async function getMcpEndpoints(mcpServerUrl: string): Promise<{
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint?: string;
  revocationEndpoint?: string;
  codeChallengeMethodsSupported?: string[];
  responseTypesSupported?: string[];
  responseModesSupported?: string[];
}> {
  const baseUrl = mcpServerUrl.split("/").slice(0, 3).join("/");

  const response = await fetch(
    `${baseUrl}/.well-known/oauth-authorization-server`
  );
  if (!response.ok) {
    throw new Error("Failed to get MCP endpoints");
  }

  const data = await response.json();
  return {
    authorizationEndpoint: data.authorization_endpoint,
    tokenEndpoint: data.token_endpoint,
    registrationEndpoint: data.registration_endpoint,
    revocationEndpoint: data.revocation_endpoint,
    codeChallengeMethodsSupported: data.code_challenge_methods_supported,
    responseTypesSupported: data.response_types_supported,
    responseModesSupported: data.response_modes_supported,
  };
}
