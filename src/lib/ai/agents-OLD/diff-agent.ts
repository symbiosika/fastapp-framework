import { compareTextVersions, formatTextDiffAsHtml } from "../../text/diff";
import type {
  AgentContext,
  AgentOutput,
  Agent,
  AgentOptions,
  AgentInputVariables,
} from "../../types/agents";

export class DiffAgent implements Agent {
  name = "diffAgent";

  async run(
    context: AgentContext,
    inputs: AgentInputVariables,
    options: AgentOptions
  ): Promise<AgentOutput> {
    try {
      // Get the old and new text versions from inputs
      const oldText = inputs.old_text ? inputs.old_text.toString() : "";
      const newText = inputs.new_text ? inputs.new_text.toString() : "";

      // Generate the diff
      const textDiff = compareTextVersions(oldText, newText);

      // Format as HTML if requested
      const formatAsHtml = options.formatAsHtml === "true";

      const result = formatAsHtml
        ? formatTextDiffAsHtml(textDiff)
        : JSON.stringify(textDiff);

      return {
        outputs: {
          default: result,
        },
        metadata: {
          diffCount: textDiff.length,
        },
      };
    } catch (error: any) {
      throw new Error(`DiffAgent error: ${error.message}`);
    }
  }
}
