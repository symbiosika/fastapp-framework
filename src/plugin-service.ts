/**
 * Exposed plugin services for the customer app
 */

import { syncKnowledgeFromPlugin } from "./lib/ai/knowledge-sync/sync";
import { registerServerPlugin } from "./lib/plugins";

export default { syncKnowledgeFromPlugin, registerServerPlugin };
