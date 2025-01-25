/**
 * Exposed file service for the customer app
 */

import {
  saveFileToTemporaryStorage,
  removeTemporaryFile,
} from "./lib/files/temporary-files";

export default {
  saveFileToTemporaryStorage,
  removeTemporaryFile,
};
