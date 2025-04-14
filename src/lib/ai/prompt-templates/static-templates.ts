import { nanoid } from "nanoid";
import {
  type PromptTemplatesInsert,
  type PromptTemplatePlaceholdersSelect,
  type PromptTemplatesSelect,
} from "../../db/db-schema";

export type StaticTemplate = PromptTemplatesSelect & {
  placeholders: Array<
    PromptTemplatePlaceholdersSelect & {
      suggestions: string[];
    }
  >;
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
 * Get a static template by name
 */
export const getServerSideStaticTemplateByName = (name: string) => {
  const t = serverSideStaticTemplates.find(
    (template) => template.name === name
  );
  if (!t) {
    throw new Error("Static template not found");
  }
  return t;
};

export type StaticTemplateImport = PromptTemplatesInsert & {
  placeholders?: Array<{
    name: string;
    description: string | undefined;
    type?: "image" | "text" | undefined;
    label?: string | undefined;
    hidden?: boolean | undefined;
    requiredByUser?: boolean | undefined;
    defaultValue?: string | null | undefined;
    suggestions?: string[];
  }>;
};

/**
 * Add a static template
 */
export const addServerSideStaticTemplate = (template: StaticTemplateImport) => {
  if (template.category !== "system") {
    throw new Error("Static templates must be of category 'system'");
  }

  const placeholders: (PromptTemplatePlaceholdersSelect & {
    suggestions: string[];
  })[] =
    template.placeholders && template.placeholders.length > 0
      ? template.placeholders.map((placeholder) => ({
          id: "static-" + nanoid(6),
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
            suggestions: [],
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
