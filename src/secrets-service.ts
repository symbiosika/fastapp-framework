/**
 * Exposed secrets service for the customer app
 */

import { deleteSecret, getSecret, setSecret } from "./lib/crypt";

export default {
  setSecret,
  getSecret,
  deleteSecret,
};
