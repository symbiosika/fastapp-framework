import { nanoid } from "nanoid";
import {
  PromptTemplatePlaceholdersSelect,
  PromptTemplatesSelect,
} from "../../db/db-schema";
import { FullPromptTemplateImport } from "./crud";

export type StaticTemplate = PromptTemplatesSelect & {
  placeholders: PromptTemplatePlaceholdersSelect[];
};

/**
 * Global valriable for static templates for the whole App!
 */
const serverSideStaticTemplates: StaticTemplate[] = [];

/**
 * Get all static templates
 */
export const getServerSideStaticTemplates = (organisationId: string) => {
  return serverSideStaticTemplates.map((template) => ({
    ...template,
    organisationId: organisationId,
  }));
};

/**
 * Add a static template
 */
export const addServerSideStaticTemplate = (
  template: FullPromptTemplateImport
) => {
  const placeholders =
    template.placeholders && template.placeholders.length > 0
      ? template.placeholders.map((placeholder) => ({
          id: placeholder.id || "static-" + nanoid(6),
          name: placeholder.name || "",
          label: placeholder.label || "",
          description: placeholder.description || "",
          hidden: placeholder.hidden || false,
          promptTemplateId: "static-" + nanoid(6),
          type: placeholder.type || "text",
          requiredByUser: placeholder.requiredByUser || false,
          defaultValue: placeholder.defaultValue || null,
          suggestions: placeholder.suggestions || [],
        }))
      : [
          {
            id: "placeholder-user_input",
            name: "user_input",
            label: "User Input",
            description: "",
            hidden: false,
            promptTemplateId: "static-" + nanoid(6),
            type: "text" as const,
            requiredByUser: false,
            defaultValue: null,
          },
        ];

  // map the entry and set defaults if empty
  const staticTemplate: StaticTemplate = {
    id: "static-" + nanoid(6),
    userId: "",
    organisationId: "",
    hidden: template.hidden || false,
    needsInitialCall: template.needsInitialCall || false,
    name: template.name,
    label: template.label || "",
    description: template.description || "",
    category: template.category || "",
    systemPrompt: template.systemPrompt,
    userPrompt: template.userPrompt || null,
    langCode: template.langCode || null,
    createdAt: template.createdAt || new Date().toISOString(),
    updatedAt: template.updatedAt || new Date().toISOString(),
    llmOptions: template.llmOptions || null,
    placeholders: placeholders,
  };
  serverSideStaticTemplates.push(staticTemplate);
};
