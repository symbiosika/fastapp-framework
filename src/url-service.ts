/**
 * Exposed url service for the customer app
 */

import {
  parseCommaSeparatedListFromUrlParam,
  parseNumberFromUrlParam,
} from "./lib/url";

export default {
  parseNumberFromUrlParam,
  parseCommaSeparatedListFromUrlParam,
};
