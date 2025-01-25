import {
  authAndSetUsersInfo,
  checkUserPermission,
} from "../../lib/utils/hono-middlewares";
import type { FastAppHono } from "../../types";
import { _GLOBAL_SERVER_CONFIG } from "../../store";

/**
 * Define the plugin management routes
 */
export default function definePingRoute(app: FastAppHono, basePath: string) {
  /**
   * Ping and internet check endpoint
   */
  app.get(
    basePath + "/ping",
    authAndSetUsersInfo,
    checkUserPermission,
    async (c) => {
      let canConnectToInternet = false;
      try {
        const response = await fetch("https://www.github.com");
        canConnectToInternet = response.ok;
      } catch (error) {
        canConnectToInternet = false;
      }

      return c.json({
        online: true,
        canConnectToInternet,
      });
    }
  );
}
