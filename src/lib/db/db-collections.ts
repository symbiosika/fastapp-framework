import { secrets, userGroupMembers, userGroups, users } from "./db-schema";
import { getDb } from "./db-connection";
import { encryptAes } from "../crypt/aes";
import type {
  CrudPermission,
  PermissionDefinitionPerTable,
} from "../types/permission-checker";
import type { SecretsEntry } from "../types/shared/db/secrets";
import { eq, inArray } from "drizzle-orm";

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
    users: {
      GET: {
        customWhere(params) {
          return eq(users.id, params.userId);
        },
      },
    },

    userGroups: {
      GET: {
        customWhere(params) {
          return inArray(
            userGroups.id,
            getDb()
              .select({ id: userGroupMembers.userGroupId })
              .from(userGroupMembers)
              .where(eq(userGroupMembers.userId, params.userId))
          );
        },
      },
    },

    userGroupMembers: {
      GET: {},
    },

    secrets: {
      // on this table the user needs access to the assigned instanceId
      // only writing is allowed. not reading!
      POST: {
        checkPermissionsFor: [],
        preAction: async (userId, body) => {
          // encrypt the value
          const b = body as SecretsEntry;
          if (!b.value) throw "No value in body";
          const encrypted = encryptAes(b.value);
          b.value = encrypted.value;
          b.type = encrypted.algorithm;
          return body;
        },
        inserter: async (_userId, body) => {
          const added = await getDb()
            .insert(secrets)
            .values({
              ...body,
              id: undefined,
            })
            .onConflictDoUpdate({
              target: [secrets.reference, secrets.name],
              set: {
                value: body.value,
              },
            })
            .returning();
          return added[0];
        },
      },
      PUT: {
        checkPermissionsFor: [
          {
            name: "instanceId",
            permission: "write",
            checker: allowAll,
          },
        ],
        preAction: async (userId, body) => {
          // encrypt the value
          const b = body as SecretsEntry;
          if (!b.value) throw "No value in body";
          const encrypted = encryptAes(b.value);
          b.value = encrypted.value;
          b.type = encrypted.algorithm;
          return body;
        },
      },
      DELETE: {
        neededParameters: [{ name: "id", operator: "eq", valueType: "uuid" }],
        checkPermissionsFor: [
          {
            name: "instanceId",
            permission: "delete",
            checker: allowAll,
          },
        ],
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
