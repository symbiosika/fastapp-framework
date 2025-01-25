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
} from "../../../../lib/plugins";
import { RESPONSES } from "../../../../lib/responses";
import type { Context } from "hono";
import { isValidUuid } from "../../../../lib/helper/uuid";

const pluginConfigSchema = v.object({
  id: v.string(),
  organisationId: v.string(),
  name: v.string(),
  description: v.string(),
  pluginType: v.string(),
  version: v.number(),
  meta: v.record(v.string(), v.any()),
});

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
    async (c) => {
      try {
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
    async (c) => {
      try {
        const organisationId = c.req.param("organisationId");
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
    async (c) => {
      const organisationId = c.req.param("organisationId");
      const body = await c.req.json();

      if (body.organisationId !== organisationId) {
        throw new HTTPException(400, {
          message: "Organisation ID from URL and body does not match",
        });
      }

      try {
        const newPlugin = await createPlugin(body);
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
    async (c) => {
      const idOrName = c.req.param("idOrName");
      const isUUID = isValidUuid(idOrName);
      const organisationId = c.req.param("organisationId");

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
    async (c) => {
      const idOrName = c.req.param("idOrName");
      const isUUID = isValidUuid(idOrName);
      const organisationId = c.req.param("organisationId");
      const body = await c.req.json();

      if (body.organisationId !== organisationId) {
        throw new HTTPException(400, {
          message: "Organisation ID from URL and body does not match",
        });
      }

      try {
        const parsed = v.parse(pluginConfigSchema, body);
        const updated = await setPluginConfig(parsed);
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
    async (c) => {
      const idOrName = c.req.param("idOrName");
      try {
        const isUUID = isValidUuid(idOrName);
        const organisationId = c.req.param("organisationId");
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
    async (c) => {
      const url = new URL(c.req.url);
      const pluginName = c.req.param("pluginName");
      const endpoint = c.req.param("endpoint");
      const organisationId = c.req.param("organisationId");

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
    async (c) => {
      const url = new URL(c.req.url);
      const pluginName = c.req.param("pluginName");
      const endpoint = c.req.param("endpoint");
      const organisationId = c.req.param("organisationId");

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
    async (c) => {
      const pluginName = c.req.param("pluginName");
      const endpoint = c.req.param("endpoint");

      const organisationId = c.req.param("organisationId");
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
    async (c) => {
      const url = new URL(c.req.url);
      const pluginName = c.req.param("pluginName");
      const endpoint = c.req.param("endpoint");
      const organisationId = c.req.param("organisationId");

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
    }
  );
}
