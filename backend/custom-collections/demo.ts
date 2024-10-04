import type { PermissionDefinitionPerTable } from "src/lib/types/permission-checker";

const collectionPermissions: PermissionDefinitionPerTable = {
  demoData: {
    GET: {
      // checkPermissionsFor: [],
    },
  },
};

export default function defineCollectionEndpoints() {
  return collectionPermissions;
}
