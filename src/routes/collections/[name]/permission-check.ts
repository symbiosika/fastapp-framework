import { getCollectionPermissions } from "../../../lib/db/db-collections";
import type { PermissionDefinition } from "../../../lib/types/permission-checker";

interface QueryParams {
  [key: string]: {
    operator: string;
    value: any;
  };
}

export const getValueForEquals = (params: QueryParams, name: string) => {
  const value = params[name];
  if (!value || (value.operator !== "eq" && value.operator !== "or")) {
    throw new Error(`"${name}[eq]=<value>" is required`);
  }
  return value.value;
};

export const permissionCheckerViaUrlParams = async (
  definition: PermissionDefinition,
  userId: string,
  params: QueryParams
) => {
  if (definition.neededParameters) {
    for (const { name, operator, valueType } of definition.neededParameters) {
      if (!params[name] || params[name].operator !== operator) {
        throw new Error(`"${name}[${operator}]=<${valueType}>" is required`);
      }
    }
  }
  if (definition.checkPermissionsFor) {
    for (const {
      name,
      permission,
      checker,
    } of definition.checkPermissionsFor) {
      let value = getValueForEquals(params, name);
      if (!Array.isArray(value)) {
        value = [value];
      }
      for (const v of value) {
        const p = await checker(userId, v);
        if (!p[permission]) {
          throw new Error("No Permission");
        }
      }
    }
  }
};

export const permissionCheckerViaBody = async (
  definition: PermissionDefinition,
  userId: string,
  body: any
) => {
  if (definition.checkPermissionsFor) {
    for (const {
      name,
      permission,
      checker,
    } of definition.checkPermissionsFor) {
      const value = body[name] ?? undefined;
      const p = await checker(userId, value);
      if (!p[permission]) {
        throw new Error("No Permission");
      }
    }
  }
};

export const getPermissionDefinionForMethod = (
  tableName: string,
  method: string
): PermissionDefinition => {
  const permissions = getCollectionPermissions();
  const definition = permissions[tableName]?.[method];
  if (!definition) {
    throw new Error(
      `No permission definition found for table "${tableName}" and method "${method}"`
    );
  }
  return definition;
};
