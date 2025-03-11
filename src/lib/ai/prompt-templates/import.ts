import { and, eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/db-connection";
import {
  promptTemplates,
  promptTemplatePlaceholders,
  promptTemplatePlaceholderExamples,
  type PromptTemplatesInsert,
} from "../../../lib/db/db-schema";
import { RESPONSES } from "../../responses";
import * as v from "valibot";

// Schema for placeholder suggestions
const placeholderSuggestionSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(255)
);

// Schema for placeholder
const placeholderSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  description: v.optional(v.string()),
  defaultValue: v.string(),
  required: v.optional(v.boolean()),
  suggestions: v.optional(v.array(placeholderSuggestionSchema)),
});

// Schema for template import
export const templateImportSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  category: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  organisationId: v.pipe(v.string(), v.minLength(1)),
  description: v.optional(v.string()),
  systemPrompt: v.pipe(v.string(), v.minLength(1)),
  userPrompt: v.pipe(v.string(), v.minLength(1)),
  placeholders: v.array(placeholderSchema),
  hidden: v.optional(v.boolean()),
});

/**
 * Interface for template import with placeholders and suggestions
 */
export interface TemplateImportData {
  name: string;
  category: string;
  organisationId: string;
  description?: string;
  systemPrompt: string;
  userPrompt: string;
  placeholders: {
    name: string;
    description?: string;
    defaultValue: string;
    required?: boolean;
    suggestions?: string[];
    hidden?: boolean;
  }[];
  hidden?: boolean;
}

/**
 * Import a complete template with all placeholders and suggestions in one step
 * Will overwrite existing template if it exists and is from category "system"
 */
export const importPromptTemplate = async (data: TemplateImportData) => {
  // Validate the input data
  try {
    v.parse(templateImportSchema, data);
  } catch (error) {
    throw new Error(`Corrupted template data: ${error}`);
  }

  let existingTemplateId: string | undefined;
  if (data.category === "system") {
    // If the template is from category "system", set the hidden flag to true
    data.hidden = true;

    // If the template is from category "system" check if already exists then delete
    const existingTemplate = await getDb()
      .select()
      .from(promptTemplates)
      .where(
        and(
          eq(promptTemplates.name, data.name),
          eq(promptTemplates.category, data.category)
        )
      );
    existingTemplateId = existingTemplate[0].id;
  }

  // Perform the import in a transaction
  return await getDb().transaction(async (tx) => {
    // 0. delete the old template if it exists
    if (existingTemplateId) {
      await getDb()
        .delete(promptTemplates)
        .where(eq(promptTemplates.id, existingTemplateId));
    }

    // 1. Create the template
    const templateData: PromptTemplatesInsert = {
      name: data.name,
      category: data.category,
      organisationId: data.organisationId,
      description: data.description || "",
      systemPrompt: data.systemPrompt,
      userPrompt: data.userPrompt,
      hidden: false,
    };

    const [template] = await tx
      .insert(promptTemplates)
      .values(templateData)
      .returning();

    // 2. Create the placeholder
    for (const placeholder of data.placeholders) {
      const [placeholderRecord] = await tx
        .insert(promptTemplatePlaceholders)
        .values({
          promptTemplateId: template.id,
          name: placeholder.name,
          label: placeholder.name,
          description: placeholder.description || "",
          defaultValue: placeholder.defaultValue,
          requiredByUser: placeholder.required,
          hidden: placeholder.hidden,
        })
        .returning();

      // 3. Create the placeholder suggestions
      if (placeholder.suggestions && placeholder.suggestions.length > 0) {
        await tx.insert(promptTemplatePlaceholderExamples).values(
          placeholder.suggestions.map((value) => ({
            placeholderId: placeholderRecord.id,
            value,
          }))
        );
      }
    }

    return {
      ...template,
      message: RESPONSES.SUCCESS,
    };
  });
};
