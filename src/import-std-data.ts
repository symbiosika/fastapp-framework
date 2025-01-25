/**
 * A small lib to import standard data into the database
 */
import { initializeCollectionPermissions } from "./lib/db/db-collections";
import {
  createDatabaseClient,
  waitForDbConnection,
} from "./lib/db/db-connection";
import { initializeFullDbSchema } from "./lib/db/db-schema";
import { insertStandardDataEntry } from "./lib/db/standard-data";
import { validateAllEnvVariables } from "./lib/utils/env-validate";
import type { DBStandardData, ServerConfig } from "./types";

export const importAllStandardData = async (
  config: ServerConfig,
  stdData: DBStandardData[],
  overwrite = false,
  deleteAllBeforeImport = false
) => {
  /**
   * validate .ENV variables
   */
  validateAllEnvVariables();

  /**
   * Create database client
   */
  initializeFullDbSchema(config.customDbSchema ?? {});
  initializeCollectionPermissions(config.customCollectionPermissions ?? {});
  createDatabaseClient(config.customDbSchema);

  /**
   * Wait for database connection
   */
  await waitForDbConnection();

  /**
   * Iterate through all standard data and insert them
   */
  await insertStandardDataEntry(stdData, overwrite, deleteAllBeforeImport);

  console.log("Standard data imported successfully");
  process.exit(0);
};
