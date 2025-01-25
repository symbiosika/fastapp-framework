/**
 * A lib for all specific data related functions
 */

import {
  createUserSpecificData,
  getUserSpecificData,
  getUserSpecificDataByKey,
  updateUserSpecificData,
  deleteUserSpecificData,
  createAppSpecificData,
  getAppSpecificData,
  getAppSpecificDataByKey,
  updateAppSpecificData,
  deleteAppSpecificData,
  createOrganisationSpecificData,
  getOrganisationSpecificData,
  getOrganisationSpecificDataByFilter,
  updateOrganisationSpecificData,
  deleteOrganisationSpecificData,
  createTeamSpecificData,
  getTeamSpecificData,
  getTeamSpecificDataByKey,
  updateTeamSpecificData,
  deleteTeamSpecificData,
} from "./lib/specific-data";

export default {
  // User specific data
  createUserSpecificData,
  getUserSpecificData,
  getUserSpecificDataByKey,
  updateUserSpecificData,
  deleteUserSpecificData,
  // App specific data
  createAppSpecificData,
  getAppSpecificData,
  getAppSpecificDataByKey,
  updateAppSpecificData,
  deleteAppSpecificData,
  // Organisation specific data
  createOrganisationSpecificData,
  getOrganisationSpecificData,
  getOrganisationSpecificDataByFilter,
  updateOrganisationSpecificData,
  deleteOrganisationSpecificData,
  // Team specific data
  createTeamSpecificData,
  getTeamSpecificData,
  getTeamSpecificDataByKey,
  updateTeamSpecificData,
  deleteTeamSpecificData,
};
