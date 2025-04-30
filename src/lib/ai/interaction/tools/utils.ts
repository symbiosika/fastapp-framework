import { _GLOBAL_SERVER_CONFIG } from "../../../../store";

export const getBaseUrl = () => {
  let BASE_URL = _GLOBAL_SERVER_CONFIG.baseUrl;
  if (BASE_URL.endsWith("/")) {
    BASE_URL = BASE_URL.slice(0, -1);
  }
  return BASE_URL;
};
