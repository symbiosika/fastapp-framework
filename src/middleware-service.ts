/**
 * Exposed the hono middlewares to check user permissions and authentication
 */

import { validateScope } from "./lib/auth/available-scopes";
import {
  authAndSetUsersInfo,
  authOrRedirectToLogin,
  checkUserPermission,
} from "./lib/utils/hono-middlewares";

import {
  isOrganisationMember,
  isOrganisationAdmin,
} from "./routes/organisation";

const middlewareService = {
  authAndSetUsersInfo,
  authOrRedirectToLogin,
  checkUserPermission,
  isOrganisationMember,
  isOrganisationAdmin,
  validateScope,
};

export default middlewareService;
