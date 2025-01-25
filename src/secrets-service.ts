/**
 * Simple lib to handle secrets
 */
import { deleteSecret, getSecret, setSecret } from "./lib/crypt";

export default {
  setSecret,
  getSecret,
  deleteSecret,
};
