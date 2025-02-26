/**
 * Exposed file service for the customer app
 */

import {
  saveFileToTemporaryStorage,
  removeTemporaryFile,
} from "./lib/files/temporary-files";
import { deleteFile, getFile, saveFile } from "./lib/storage";

export default {
  saveFileToTemporaryStorage,
  removeTemporaryFile,
  saveFile,
  getFile,
  deleteFile,
};
