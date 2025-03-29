import { and, eq } from "drizzle-orm";
import {
  aiProviderModels,
  type AiProviderModelsInsert,
  type AiProviderModelsSelect,
  getDb,
} from "../../../dbSchema";
import { HTTPException } from "../../../types";

/**
 * Get all AI provider models for an organisation
 */
export async function getAllAiProviderModels(
  organisationId: string
): Promise<AiProviderModelsSelect[]> {
  try {
    return await getDb().query.aiProviderModels.findMany({
      where: eq(aiProviderModels.organisationId, organisationId),
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
