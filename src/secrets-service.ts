/**
 * Exposed secrets service for the customer app
 */

import { deleteSecret, getSecret, setSecret } from "./lib/crypt";
import { encryptAes, decryptAes } from "./lib/crypt/aes";

export default {
  setSecret,
  getSecret,
  deleteSecret,
  encryptAes,
  decryptAes,
};
