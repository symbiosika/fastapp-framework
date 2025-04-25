/**
 * Exposed user management service for the customer app
 */

import {
  addUserToOrganisation,
  addUserToTeam,
  getUser,
  getUserByEmail,
  getUserById,
  getUserOrganisations,
  getUsersLastSelectedOrganisation,
  getUserTeams,
  removeUserFromOrganisation,
  removeUserFromTeam,
  updateUser,
} from "./lib/usermanagement/user";
import {
  addOrganisationMember,
  createOrganisation,
  deleteOrganisation,
  getLastOrganisation,
  getOrganisation,
  getOrganisationMembers,
  getPermissionsByOrganisation,
  getTeamsAndMembersByOrganisation,
  removeOrganisationMember,
  setLastOrganisation,
  updateOrganisation,
} from "./lib/usermanagement/oganisations";
import {
  acceptAllPendingInvitationsForUser,
  acceptOrganisationInvitation,
  createOrganisationInvitation,
  declineOrganisationInvitation,
  getAllOrganisationInvitations,
} from "./lib/usermanagement/invitations";
import {
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  getTeamsByOrganisation,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
} from "./lib/usermanagement/teams";
import {
  createPermissionGroup,
  getPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
  getPermissionGroupsByOrganisation,
  createPathPermission,
  getPathPermission,
  updatePathPermission,
  deletePathPermission,
  assignPermissionToGroup,
  removePermissionFromGroup,
  createPermissionGroupWithPermissions,
} from "./lib/usermanagement/permissions";

export default {
  // users
  getUser,
  getUserById,
  getUserByEmail,
  updateUser,
  addUserToOrganisation,
  removeUserFromOrganisation,
  getUserTeams,
  addUserToTeam,
  removeUserFromTeam,
  getUserOrganisations,
  // organisations
  createOrganisation,
  getOrganisation,
  updateOrganisation,
  deleteOrganisation,
  getUsersLastSelectedOrganisation,
  // teams
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  getTeamsByOrganisation,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  // permission groups
  createPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
  getPermissionGroup,
  getPermissionGroupsByOrganisation,
  // path permissions
  createPathPermission,
  getPathPermission,
  updatePathPermission,
  deletePathPermission,
  // helper
  createPermissionGroupWithPermissions,
  // invitations
  getAllOrganisationInvitations,
  acceptOrganisationInvitation,
  declineOrganisationInvitation,
  createOrganisationInvitation,
  acceptAllPendingInvitationsForUser,
  assignPermissionToGroup,
  removePermissionFromGroup,
  getLastOrganisation,
  setLastOrganisation,
  getTeamsAndMembersByOrganisation,
  getPermissionsByOrganisation,
  addOrganisationMember,
  removeOrganisationMember,
  getOrganisationMembers,
};
