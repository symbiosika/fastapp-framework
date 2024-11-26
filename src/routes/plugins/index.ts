import { HTTPException } from "../..";
import { authAndSetUsersInfo } from "../../helper";
import type { FastAppHono } from "../../types";
import * as v from "valibot";
import {
  setPluginConfig,
  getPlugin,
  getAllInstalledPlugins,
  getAllAvailablePlugins,
  createPlugin,
  deletePlugin,
  getActivePluginByName,
  getAvailablePluginByType,
} from "../../lib/plugins";
import { RESPONSES } from "../../lib/responses";
import type { Context } from "hono";
import { isValidUuid } from "../../lib/helper/uuid";

const pluginConfigSchema = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  pluginType: v.string(),
  version: v.number(),
  meta: v.record(v.string(), v.any()),
});

const executeEndpoint = async (
  c: Context,
  pluginName: string,
  endpoint: string,
  method: string,
  body?: any,
  params?: { [k: string]: string }
) => {
  // check if the plugin exists and get its type
  const pluginConfig = getActivePluginByName(pluginName);
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
    API_BASE_PATH + "/plugins/available",
    authAndSetUsersInfo,
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
    API_BASE_PATH + "/plugins/installed",
    authAndSetUsersInfo,
    async (c) => {
      try {
        const plugins = await getAllInstalledPlugins();
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
    API_BASE_PATH + "/plugins/installed",
    authAndSetUsersInfo,
    async (c) => {
      const body = await c.req.json();
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
    API_BASE_PATH + "/plugins/installed/:idOrName",
    authAndSetUsersInfo,
    async (c) => {
      const idOrName = c.req.param("idOrName");
      const isUUID = isValidUuid(idOrName);

      try {
        const plugin = await getPlugin({
          id: isUUID ? idOrName : undefined,
          name: isUUID ? undefined : idOrName,
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
    API_BASE_PATH + "/plugins/installed/:idOrName",
    authAndSetUsersInfo,
    async (c) => {
      const idOrName = c.req.param("idOrName");
      const isUUID = isValidUuid(idOrName);
      const body = await c.req.json();
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
    API_BASE_PATH + "/plugins/installed/:idOrName",
    authAndSetUsersInfo,
    async (c) => {
      const idOrName = c.req.param("idOrName");
      try {
        const isUUID = isValidUuid(idOrName);

        await deletePlugin({
          id: isUUID ? idOrName : undefined,
          name: isUUID ? undefined : idOrName,
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
    API_BASE_PATH + "/plugins/gw/:pluginName/:endpoint",
    authAndSetUsersInfo,
    async (c) => {
      const url = new URL(c.req.url);
      const pluginName = c.req.param("pluginName");
      const endpoint = c.req.param("endpoint");
      // create a dict from all search params
      const searchParams = Object.fromEntries(url.searchParams.entries());
      return executeEndpoint(
        c,
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
    API_BASE_PATH + "/plugins/gw/:pluginName/:endpoint",
    authAndSetUsersInfo,
    async (c) => {
      const url = new URL(c.req.url);
      const pluginName = c.req.param("pluginName");
      const endpoint = c.req.param("endpoint");
      // create a dict from all search params
      const searchParams = Object.fromEntries(url.searchParams.entries());
      const body = await c.req.json();
      return executeEndpoint(
        c,
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
    API_BASE_PATH + "/plugins/gw/:pluginName/:endpoint",
    authAndSetUsersInfo,
    async (c) => {
      const pluginName = c.req.param("pluginName");
      const endpoint = c.req.param("endpoint");
      const url = new URL(c.req.url);
      // create a dict from all search params
      const searchParams = Object.fromEntries(url.searchParams.entries());
      return executeEndpoint(
        c,
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
    API_BASE_PATH + "/plugins/gw/:pluginName/:endpoint",
    authAndSetUsersInfo,
    async (c) => {
      const url = new URL(c.req.url);
      const pluginName = c.req.param("pluginName");
      const endpoint = c.req.param("endpoint");
      // create a dict from all search params
      const searchParams = Object.fromEntries(url.searchParams.entries());
      const body = await c.req.json();
      return executeEndpoint(
        c,
        pluginName,
        endpoint,
        "PUT",
        body,
        searchParams
      );
    }
  );
}
