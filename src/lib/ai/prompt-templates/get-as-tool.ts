import { getFullPromptTemplate, getFullPromptTemplates } from "./crud";
import type { ToolReturn, ToolContext } from "../../ai/ai-sdk/types";
import { jsonSchema } from "ai";
import { chat } from "../interaction";

/**
 * Get a specific assistant tool for a given user.
 */
export async function getAssistantToolForUser(
  userId: string,
  organisationId: string,
  toolName: string
): Promise<ToolReturn> {
  const template = await getFullPromptTemplate({
    promptId: toolName.replace("assistant:", ""),
    organisationId,
  });

  if (!template || !template.deployAsTool) {
    throw new Error("Assistant tool not found");
  }

  // Build parameters schema from placeholders
  const properties: Record<string, any> = {};
  const required: string[] = [];
  for (const placeholder of template.placeholders || []) {
    const prop: any = {
      type: placeholder.type === "image" ? "string" : "string", // Could be 'string' or 'image' (file upload) in future
      description:
        placeholder.description || placeholder.label || placeholder.name,
    };
    if (placeholder.suggestions && placeholder.suggestions.length > 0) {
      prop.enum = placeholder.suggestions;
    }
    if (
      placeholder.defaultValue !== undefined &&
      placeholder.defaultValue !== null
    ) {
      prop.default = placeholder.defaultValue;
    }
    if (placeholder.requiredByUser) {
      required.push(placeholder.name);
    }
    properties[placeholder.name] = prop;
  }
  // Tool definition
  const tool = {
    description: template.description || template.label || template.name,
    parameters: jsonSchema({
      type: "object",
      properties,
      required,
    }),
    // The execute function fills the prompt using initTemplateMessage
    async execute(params: Record<string, string>) {
      // Use initTemplateMessage to fill the prompt
      const result = await chat({
        input: params,
        useTemplate: template.id,
        context: {
          organisationId,
          userId,
        },
      });
      return result.message.content;
    },
  };
  return {
    name: toolName,
    tool,
  };
}

/**
 * Get all assistant tools for a given user.
 * Will use label and description from the template.
 */
export async function getAssistantToolsForUser(
  userId: string,
  organisationId: string
): Promise<{ name: string; label: string; description: string }[]> {
  const templates = await getFullPromptTemplates(organisationId);
  return templates
    .filter((template) => template.deployAsTool)
    .map((template) => {
      const toolName = `assistant:${template.id}`;
      return {
        name: toolName,
        label: template.label || template.name,
        description: template.description || template.label || template.name,
      };
    });
}
