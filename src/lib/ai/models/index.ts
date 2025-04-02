import { and, eq } from "drizzle-orm";
import {
  aiProviderModels,
  type AiProviderModelsInsert,
  type AiProviderModelsSelect,
  getDb,
} from "../../../dbSchema";
import { HTTPException } from "../../../types";

// Global server state
let availableApiKeys: { [name: string]: boolean } | null = null;

export const getAvailableApiKeys = (): {
  [name: string]: boolean;
} => {
  if (availableApiKeys) {
    return availableApiKeys;
  }

  const keys = {
    openai:
      process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== ""
        ? true
        : false,
    anthropic:
      process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== ""
        ? true
        : false,
    groq:
      process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== ""
        ? true
        : false,
    gemini:
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== ""
        ? true
        : false,
    claude:
      process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY !== ""
        ? true
        : false,
    mistral:
      process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY !== ""
        ? true
        : false,
    azure:
      process.env.AZURE_API_KEY && process.env.AZURE_API_KEY !== ""
        ? true
        : false,
    perplexity:
      process.env.PERPLEXITY_API_KEY && process.env.PERPLEXITY_API_KEY !== ""
        ? true
        : false,
    ionos:
      process.env.IONOS_API_KEY && process.env.IONOS_API_KEY !== ""
        ? true
        : false,
  };

  availableApiKeys = keys;
  return keys;
};

/**
 * Get all AI provider models for an organisation
 */
export async function getAllAiProviderModels(
  organisationId: string
): Promise<AiProviderModelsSelect[]> {
  try {
    const models = await getDb().query.aiProviderModels.findMany({
      where: eq(aiProviderModels.organisationId, organisationId),
    });

    const apiKeys = getAvailableApiKeys();
    // filter models by availableApiKeys
    return models.filter((model) => {
      return apiKeys[model.name];
    });
  } catch (error) {
    throw new HTTPException(500, {
      message: "Failed to get AI provider models: " + error,
    });
  }
}

/**
 * Get a single AI provider model by ID
 */
export async function getAiProviderModelById(
  organisationId: string,
  modelId: string
): Promise<AiProviderModelsSelect> {
  try {
    const model = await getDb().query.aiProviderModels.findFirst({
      where: and(
        eq(aiProviderModels.id, modelId),
        eq(aiProviderModels.organisationId, organisationId)
      ),
    });

    if (!model) {
      throw new Error("Model not found");
    }

    const apiKeys = getAvailableApiKeys();
    if (!apiKeys[model.name]) {
      throw new Error("Model not available");
    }

    return model;
  } catch (error) {
    throw new HTTPException(500, {
      message: "Failed to get AI provider model: " + error,
    });
  }
}

/**
 * Create a new AI provider model
 */
export async function createAiProviderModel(
  data: AiProviderModelsInsert
): Promise<AiProviderModelsSelect> {
  try {
    const [model] = await getDb()
      .insert(aiProviderModels)
      .values(data)
      .returning()
      .onConflictDoUpdate({
        target: [
          aiProviderModels.organisationId,
          aiProviderModels.model,
          aiProviderModels.provider,
        ],
        set: data,
      });

    return model;
  } catch (error) {
    throw new HTTPException(500, {
      message: "Failed to create AI provider model: " + error,
    });
  }
}

/**
 * Update an AI provider model
 */
export async function updateAiProviderModel(
  organisationId: string,
  modelId: string,
  data: Partial<AiProviderModelsInsert>
): Promise<AiProviderModelsSelect> {
  try {
    const [updatedModel] = await getDb()
      .update(aiProviderModels)
      .set(data)
      .where(
        and(
          eq(aiProviderModels.id, modelId),
          eq(aiProviderModels.organisationId, organisationId)
        )
      )
      .returning();

    if (!updatedModel) {
      throw new Error("Model not found or not updated");
    }

    return updatedModel;
  } catch (error) {
    throw new HTTPException(500, {
      message: "Failed to update AI provider model: " + error,
    });
  }
}

/**
 * Delete an AI provider model
 */
export async function deleteAiProviderModel(
  organisationId: string,
  modelId: string
): Promise<AiProviderModelsSelect> {
  try {
    const [deletedModel] = await getDb()
      .delete(aiProviderModels)
      .where(
        and(
          eq(aiProviderModels.id, modelId),
          eq(aiProviderModels.organisationId, organisationId)
        )
      )
      .returning();

    if (!deletedModel) {
      throw new Error("Model not found or not deleted");
    }

    return deletedModel;
  } catch (error) {
    throw new HTTPException(500, {
      message: "Failed to delete AI provider model: " + error,
    });
  }
}
