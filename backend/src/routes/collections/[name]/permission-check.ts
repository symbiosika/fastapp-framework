import { collectionPermissions } from "../../../lib/db/db-collections";
import { ErrorWithLogging } from "../../../lib/log";
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
    throw new ErrorWithLogging(
      `"${name}[eq]=<value>" is required`,
      "debug",
      "getValueForEquals"
    );
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
        throw new ErrorWithLogging(
          `"${name}[${operator}]=<${valueType}>" is required`,
          "debug",
          "permissionCheckerViaUrlParams"
        );
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
          throw new ErrorWithLogging(
            "No Permission",
            "debug",
            "permissionCheckerViaUrlParams"
          );
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
        throw new ErrorWithLogging(
          "No Permission",
          "debug",
          "permissionCheckerViaBody"
        );
      }
    }
  }
};

export const getPermissionDefinionForMethod = (
  tableName: string,
  method: string
): PermissionDefinition => {
  const definition = collectionPermissions[tableName]?.[method];
  if (!definition) {
    throw new ErrorWithLogging(
      `No permission definition found for table "${tableName}" and method "${method}"`,
      "debug",
      "getPermissionDefinionForMethod"
    );
  }
  return definition;
};
