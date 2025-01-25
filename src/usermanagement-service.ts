/**
 * A lib for all user management related functions
 */

import {
  addUserToOrganisation,
  addUserToTeam,
  getUser,
  getUserByEmail,
  getUserById,
  getUserOrganisations,
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
  // teams
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  getTeamsByOrganisation,
  addTeamMember,
  removeTeamMember,
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
