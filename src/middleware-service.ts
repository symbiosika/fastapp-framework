/**
 * Exposed the hono middlewares to check user permissions and authentication
 */

import {
  authAndSetUsersInfo,
  authOrRedirectToLogin,
  checkUserPermission,
} from "./lib/utils/hono-middlewares";

const middlewareService = {
  authAndSetUsersInfo,
  authOrRedirectToLogin,
  checkUserPermission,
};

export default middlewareService;
