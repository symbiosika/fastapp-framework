/**
 * Exposed specific data service for the customer app
 */

import {
  createUserSpecificData,
  getUserSpecificData,
  updateUserSpecificData,
  deleteUserSpecificData,
  createAppSpecificData,
  getAppSpecificData,
  deleteAppSpecificData,
  createOrganisationSpecificData,
  getOrganisationSpecificData,
  deleteOrganisationSpecificData,
  createTeamSpecificData,
  getTeamSpecificData,
  updateTeamSpecificData,
  deleteTeamSpecificData,
  updateAppSpecificData,
  updateOrganisationSpecificData,
} from "./lib/specific-data";

export default {
  // User specific data
  createUserSpecificData,
  getUserSpecificData,
  updateUserSpecificData,
  deleteUserSpecificData,
  // App specific data
  createAppSpecificData,
  getAppSpecificData,
  updateAppSpecificData,
  deleteAppSpecificData,
  // Organisation specific data
  createOrganisationSpecificData,
  getOrganisationSpecificData,
  updateOrganisationSpecificData,
  deleteOrganisationSpecificData,
  // Team specific data
  createTeamSpecificData,
  getTeamSpecificData,
  updateTeamSpecificData,
  deleteTeamSpecificData,
};
