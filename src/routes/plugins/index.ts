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
} from "../../lib/plugins";
import { RESPONSES } from "../../lib/responses";

const pluginConfigSchema = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  pluginType: v.string(),
  version: v.number(),
  meta: v.record(v.string(), v.any()),
});

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  app.get(API_BASE_PATH + "/available", authAndSetUsersInfo, async (c) => {
    try {
      const plugins = await getAllAvailablePlugins();
      return c.json(plugins);
    } catch (error) {
      throw new HTTPException(400, {
        message: `Failed to get plugin: ${error}`,
      });
    }
  });

  /**
   * Get plugin configuration
   */
  app.get(API_BASE_PATH + "/installed", authAndSetUsersInfo, async (c) => {
    try {
      const plugins = await getAllInstalledPlugins();
      return c.json(plugins);
    } catch (error) {
      throw new HTTPException(400, {
        message: `Failed to get plugin: ${error}`,
      });
    }
  });

  /**
   * Register a new plugin
   */
  app.post(API_BASE_PATH + "/installed", authAndSetUsersInfo, async (c) => {
    const body = await c.req.json();
    try {
      const newPlugin = await createPlugin(body);
      return c.json(newPlugin);
    } catch (error) {
      throw new HTTPException(400, {
        message: `Failed to install plugin: ${error}`,
      });
    }
  });

  /**
   * Get plugin configuration
   */
  app.get(
    API_BASE_PATH + "/installed/:idOrName",
    authAndSetUsersInfo,
    async (c) => {
      const idOrName = c.req.param("idOrName");
      const isUUID = uuidPattern.test(idOrName);

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
  app.put(API_BASE_PATH + "/installed/:id", authAndSetUsersInfo, async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();

    try {
      const parsed = v.parse(pluginConfigSchema, {
        ...body,
        id, // Ensure ID from URL is used
      });
      const updated = await setPluginConfig(parsed);
      return c.json(updated);
    } catch (error) {
      throw new HTTPException(400, {
        message: `Failed to update plugin: ${error}`,
      });
    }
  });

  /**
   * Delete a plugin configuration
   */
  app.delete(
    API_BASE_PATH + "/installed/:idOrName",
    authAndSetUsersInfo,
    async (c) => {
      const idOrName = c.req.param("idOrName");
      try {
        // UUID regex pattern
        const isUUID = uuidPattern.test(idOrName);
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
}
