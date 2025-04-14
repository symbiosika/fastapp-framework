/**
 * Routes to manage the plugins of an organisation
 * These routes are protected by JWT and CheckPermission middleware
 */

import { HTTPException } from "../../../../types";
import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../../../lib/utils/hono-middlewares";
import type { FastAppHono } from "../../../../types";
import * as v from "valibot";
import {
  setPluginConfig,
  getPlugin,
  getAllInstalledPluginsByOrganisationId,
  getAllAvailablePlugins,
  createPlugin,
  deletePlugin,
  getActivePluginByName,
  getAvailablePluginByType,
  availablePluginsSchema,
} from "../../../../lib/plugins";
import { RESPONSES } from "../../../../lib/responses";
import type { Context } from "hono";
import { isValidUuid } from "../../../../lib/helper/uuid";
import { resolver, validator } from "hono-openapi/valibot";
import { describeRoute } from "hono-openapi";
import {
  pluginsInsertSchema,
  pluginsSelectSchema,
  pluginsUpdateSchema,
} from "../../../../dbSchema";
import { isOrganisationMember } from "../..";
import { validateScope } from "../../../../lib/utils/validate-scope";

const executeEndpoint = async (
  c: Context,
  organisationId: string,
  pluginName: string,
  endpoint: string,
  method: string,
  body?: any,
  params?: { [k: string]: string }
) => {
  // check if the plugin exists and get its type
  const pluginConfig = getActivePluginByName(pluginName, organisationId);
  const plugin = getAvailablePluginByType(pluginConfig.pluginType);

  // execute the action if it is a valid GET endpoint
  if (
    plugin.apiEndpoints &&
    plugin.apiEndpoints[endpoint] &&
    plugin.apiEndpoints[endpoint].method === method
  ) {
    try {
      const response = await plugin.apiEndpoints[endpoint].action(
        pluginConfig,
        params ?? {},
        body ?? {}
      );
      console.log("Response", response);
      return c.json(response);
    } catch (err) {
      throw new HTTPException(400, { message: err + "" });
    }
  } else {
    throw new HTTPException(400, { message: "Endpoint or method not found" });
  }
};

/**
 * Define the plugin management routes
 */
export default function definePluginRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  /**
   * Get plugin configuration
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/plugins/available",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/plugins/available",
      tags: ["plugins"],
      summary: "Get all available plugins",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(availablePluginsSchema),
            },
          },
        },
      },
    }),
    validateScope("plugins:read"),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const plugins = await getAllAvailablePlugins();
        return c.json(plugins);
      } catch (error) {
        throw new HTTPException(400, {
          message: `Failed to get plugin: ${error}`,
        });
      }
    }
  );

  /**
   * Get plugin configuration
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/plugins/installed",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/plugins/installed",
      tags: ["plugins"],
      summary: "Get all installed plugins",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(v.array(pluginsSelectSchema)),
            },
          },
        },
      },
    }),
    validateScope("plugins:read"),
    validator("param", v.object({ organisationId: v.string() })),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId } = c.req.valid("param");
        const plugins =
          await getAllInstalledPluginsByOrganisationId(organisationId);
        return c.json(plugins);
      } catch (error) {
        throw new HTTPException(400, {
          message: `Failed to get plugin: ${error}`,
        });
      }
    }
  );

  /**
   * Register a new plugin
   */
  app.post(
    API_BASE_PATH + "/organisation/:organisationId/plugins/installed",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/plugins/installed",
      tags: ["plugins"],
      summary: "Register a new plugin",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(pluginsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("plugins:write"),
    validator("param", v.object({ organisationId: v.string() })),
    validator("json", pluginsInsertSchema),
    isOrganisationMember,
    async (c) => {
      const { organisationId } = c.req.valid("param");
      const data = c.req.valid("json");

      try {
        const newPlugin = await createPlugin({
          ...data,
          organisationId,
        });
        return c.json(newPlugin);
      } catch (error) {
        throw new HTTPException(400, {
          message: `Failed to install plugin: ${error}`,
        });
      }
    }
  );

  /**
   * Get plugin configuration
   */
  app.get(
    API_BASE_PATH + "/organisation/:organisationId/plugins/installed/:idOrName",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/plugins/installed/:idOrName",
      tags: ["plugins"],
      summary: "Get plugin configuration",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(pluginsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("plugins:read"),
    validator(
      "param",
      v.object({ organisationId: v.string(), idOrName: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      const { organisationId, idOrName } = c.req.valid("param");
      const isUUID = isValidUuid(idOrName);
      try {
        const plugin = await getPlugin({
          id: isUUID ? idOrName : undefined,
          name: isUUID ? undefined : idOrName,
          organisationId: organisationId,
        });
        return c.json(plugin);
      } catch (error) {
        throw new HTTPException(400, {
          message: `Failed to get plugin: ${error}`,
        });
      }
    }
  );

  /**
   * Update plugin configuration
   */
  app.put(
    API_BASE_PATH + "/organisation/:organisationId/plugins/installed/:idOrName",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/plugins/installed/:idOrName",
      tags: ["plugins"],
      summary: "Update plugin configuration",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(pluginsSelectSchema),
            },
          },
        },
      },
    }),
    validateScope("plugins:write"),
    validator(
      "param",
      v.object({ organisationId: v.string(), idOrName: v.string() })
    ),
    validator("json", pluginsUpdateSchema),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, idOrName } = c.req.valid("param");
        const body = c.req.valid("json");

        if (body.organisationId !== organisationId) {
          throw new HTTPException(400, {
            message: "Organisation ID from URL and body does not match",
          });
        }

        const updated = await setPluginConfig(body);
        return c.json(updated);
      } catch (error) {
        throw new HTTPException(400, {
          message: `Failed to update plugin: ${error}`,
        });
      }
    }
  );

  /**
   * Delete a plugin configuration
   */
  app.delete(
    API_BASE_PATH + "/organisation/:organisationId/plugins/installed/:idOrName",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/plugins/installed/:idOrName",
      tags: ["plugins"],
      summary: "Delete a plugin configuration",
      responses: {
        200: {
          description: "Successful response",
        },
      },
    }),
    validateScope("plugins:write"),
    validator(
      "param",
      v.object({ organisationId: v.string(), idOrName: v.string() })
    ),
    isOrganisationMember,
    async (c) => {
      const { organisationId, idOrName } = c.req.valid("param");
      const isUUID = isValidUuid(idOrName);
      try {
        await deletePlugin({
          id: isUUID ? idOrName : undefined,
          name: isUUID ? undefined : idOrName,
          organisationId: organisationId,
        });
        return c.json(RESPONSES.SUCCESS);
      } catch (error) {
        throw new HTTPException(400, {
          message: `Failed to delete plugin: ${error}`,
        });
      }
    }
  );

  /**
   * API Gateway for the plugin endpoints: GET
   */
  app.get(
    API_BASE_PATH +
      "/organisation/:organisationId/plugins/gw/:pluginName/:endpoint",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "get",
      path: "/organisation/:organisationId/plugins/gw/:pluginName/:endpoint",
      tags: ["plugins-gateway"],
      summary: "API Gateway for the plugin endpoints: GET",
      responses: {
        200: {
          description: "Successful response. Dynamic Body from Plugin",
        },
      },
    }),
    validateScope("plugins:read"),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        pluginName: v.string(),
        endpoint: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, pluginName, endpoint } = c.req.valid("param");
        const url = new URL(c.req.url);

        // create a dict from all search params
        const searchParams = Object.fromEntries(url.searchParams.entries());
        return executeEndpoint(
          c,
          organisationId,
          pluginName,
          endpoint,
          "GET",
          undefined,
          searchParams
        );
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error executing plugin endpoint: " + err,
        });
      }
    }
  );

  /**
   * API Gateway for the plugin endpoints: POST
   */
  app.post(
    API_BASE_PATH +
      "/organisation/:organisationId/plugins/gw/:pluginName/:endpoint",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "post",
      path: "/organisation/:organisationId/plugins/gw/:pluginName/:endpoint",
      tags: ["plugins-gateway"],
      summary: "API Gateway for the plugin endpoints: POST",
      responses: {
        200: {
          description: "Successful response. Dynamic Body from Plugin",
        },
      },
    }),
    validateScope("plugins:read"),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        pluginName: v.string(),
        endpoint: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, pluginName, endpoint } = c.req.valid("param");
        const url = new URL(c.req.url);

        // create a dict from all search params
        const searchParams = Object.fromEntries(url.searchParams.entries());
        const body = await c.req.json();
        return executeEndpoint(
          c,
          organisationId,
          pluginName,
          endpoint,
          "POST",
          body,
          searchParams
        );
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error executing plugin endpoint: " + err,
        });
      }
    }
  );

  /**
   * API Gateway for the plugin endpoints: DELETE
   */
  app.delete(
    API_BASE_PATH +
      "/organisation/:organisationId/plugins/gw/:pluginName/:endpoint",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "delete",
      path: "/organisation/:organisationId/plugins/gw/:pluginName/:endpoint",
      tags: ["plugins-gateway"],
      summary: "API Gateway for the plugin endpoints: DELETE",
      responses: {
        200: {
          description: "Successful response. Dynamic Body from Plugin",
        },
      },
    }),
    validateScope("plugins:read"),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        pluginName: v.string(),
        endpoint: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const { organisationId, pluginName, endpoint } = c.req.valid("param");
        const url = new URL(c.req.url);
        // create a dict from all search params
        const searchParams = Object.fromEntries(url.searchParams.entries());
        return executeEndpoint(
          c,
          organisationId,
          pluginName,
          endpoint,
          "DELETE",
          undefined,
          searchParams
        );
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error executing plugin endpoint: " + err,
        });
      }
    }
  );

  /**
   * API Gateway for the plugin endpoints: PUT
   */
  app.put(
    API_BASE_PATH +
      "/organisation/:organisationId/plugins/gw/:pluginName/:endpoint",
    authAndSetUsersInfo,
    checkUserPermission,
    describeRoute({
      method: "put",
      path: "/organisation/:organisationId/plugins/gw/:pluginName/:endpoint",
      tags: ["plugins-gateway"],
      summary: "API Gateway for the plugin endpoints: PUT",
      responses: {
        200: {
          description: "Successful response. Dynamic Body from Plugin",
        },
      },
    }),
    validateScope("plugins:read"),
    validator(
      "param",
      v.object({
        organisationId: v.string(),
        pluginName: v.string(),
        endpoint: v.string(),
      })
    ),
    isOrganisationMember,
    async (c) => {
      try {
        const url = new URL(c.req.url);
        const { organisationId, pluginName, endpoint } = c.req.valid("param");

        // create a dict from all search params
        const searchParams = Object.fromEntries(url.searchParams.entries());
        const body = await c.req.json();
        return executeEndpoint(
          c,
          organisationId,
          pluginName,
          endpoint,
          "PUT",
          body,
          searchParams
        );
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error executing plugin endpoint: " + err,
        });
      }
    }
  );
}
