import {
  jobs,
  promptSnippets,
  promptTemplates,
  teamMembers,
  teams,
  userGroupMembers,
  userPermissionGroups,
  users,
  userSpecificData,
} from "./db-schema";
import { getDb } from "./db-connection";
import type {
  CrudPermission,
  PermissionDefinitionPerTable,
} from "../types/permission-checker";
import { and, eq, inArray, isNull, or } from "drizzle-orm";

const allowAll = async (): Promise<CrudPermission> => {
  return {
    read: true,
    write: true,
    delete: true,
    create: true,
  };
};

let validTableNames: string[] = [];

let initializedPermissions: PermissionDefinitionPerTable;

export const initializeCollectionPermissions = (
  customPermissions: PermissionDefinitionPerTable
) => {
  // init permissions
  const permissions: PermissionDefinitionPerTable = {
    ...customPermissions,
    // read-only for the user itself
    users: {
      GET: {
        customWhere(params) {
          return eq(users.id, params.userId);
        },
      },
    },

    // read-only for the user itself
    userGroups: {
      GET: {
        customWhere(params) {
          return inArray(
            userPermissionGroups.id,
            getDb()
              .select({ id: userGroupMembers.userGroupId })
              .from(userGroupMembers)
              .where(eq(userGroupMembers.userId, params.userId))
          );
        },
      },
    },

    // read-only for the user itself
    userGroupMembers: {
      GET: {
        customWhere(params) {
          return eq(userGroupMembers.userId, params.userId);
        },
      },
    },

    // crud for the user itself
    userSpecificData: {
      GET: {
        customWhere(params) {
          return eq(userSpecificData.userId, params.userId);
        },
      },
      POST: {
        customWhere(params) {
          return eq(userSpecificData.userId, params.userId);
        },
      },
      PUT: {
        customWhere(params) {
          return eq(userSpecificData.userId, params.userId);
        },
      },
      DELETE: {
        customWhere(params) {
          return eq(userSpecificData.userId, params.userId);
        },
      },
    },

    // read-only for the user itself
    jobs: {
      GET: {
        customWhere(params) {
          return eq(jobs.userId, params.userId);
        },
      },
    },

    promptTemplates: {
      GET: {
        customWhere(params) {
          return and(
            or(
              eq(promptTemplates.userId, params.userId),
              isNull(promptTemplates.userId)
            ),
            eq(promptTemplates.hidden, false)
          );
        },
      },
      POST: {
        customWhere(params) {
          return eq(promptTemplates.userId, params.userId);
        },
      },
      PUT: {
        customWhere(params) {
          return eq(promptTemplates.userId, params.userId);
        },
      },
      DELETE: {
        customWhere(params) {
          return eq(promptTemplates.userId, params.userId);
        },
      },
    },

    promptSnippets: {
      GET: {
        customWhere(params) {
          return or(
            eq(promptSnippets.userId, params.userId),
            isNull(promptSnippets.userId)
          );
        },
      },
      POST: {
        customWhere(params) {
          return eq(promptSnippets.userId, params.userId);
        },
      },
      PUT: {
        customWhere(params) {
          return eq(promptSnippets.userId, params.userId);
        },
      },
      DELETE: {
        customWhere(params) {
          return eq(promptSnippets.userId, params.userId);
        },
      },
    },

    teams: {
      GET: {
        customWhere(params) {
          return inArray(
            teams.id,
            getDb()
              .select({ id: teamMembers.teamId })
              .from(teamMembers)
              .where(eq(teamMembers.userId, params.userId))
          );
        },
      },
    },
  };

  validTableNames = Object.keys(permissions);
  initializedPermissions = permissions;
};

export const getCollectionPermissions = () => {
  return initializedPermissions;
};

export const getValidCollectionTableNames = () => {
  return validTableNames;
};
