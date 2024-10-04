import { secrets } from "./db-schema";
import { getDb } from "./db-connection";
import { encryptAes } from "../crypt/aes";
import type {
  CrudPermission,
  PermissionDefinitionPerTable,
} from "../types/permission-checker";
import type { SecretsEntry } from "../types/shared/db/secrets";
import { join } from "path";
import { readdirSync } from "fs";

export const allowAll = async (): Promise<CrudPermission> => {
  return {
    read: true,
    write: true,
    delete: true,
    create: true,
  };
};

// Import all custom collection files
const customCollectionsPath = join(__dirname, "../../..", "custom-collections");
const customCollectionFiles = readdirSync(customCollectionsPath).filter(
  (file) => file.endsWith(".ts") && file !== "index.ts"
);
// Import and collect permissions from each file
const customPermissions: PermissionDefinitionPerTable = Object.assign(
  {},
  ...customCollectionFiles.map((file) => {
    const module = require(join(customCollectionsPath, file));
    if (
      typeof module.default === "function" &&
      module.default.name === "defineCollectionEndpoints"
    ) {
      console.log("Importing custom collection from:", file);
      return module.default();
    }
    return {};
  })
);

export const customTables: string[] = Object.keys(customPermissions);
console.log("Added customTables to collections", customTables);

export const collectionPermissions: PermissionDefinitionPerTable = {
  ...customPermissions,
  users: {
    GET: {
      checkPermissionsFor: [
        {
          name: "id",
          permission: "read",
          checker: allowAll,
        },
      ],
    },
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
