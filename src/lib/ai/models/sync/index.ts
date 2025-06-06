import { HTTPException } from "../../../../types";
import {
  getAllAiProviderModels,
  createAiProviderModel,
  deleteAiProviderModel,
  updateAiProviderModel,
} from "../index";
import {
  type AiProviderModelsInsert,
  type AiProviderModelsSelect,
} from "../../../../dbSchema";
import {
  type PublicModelsResponse,
  type PublicAIModel,
  type SyncModelsResult,
} from "../types";

/**
 * Synchronizes AI models between the public models API and organisation models
 * @param organisationId The organisation ID to sync models for
 * @returns Object containing counts of added and removed models
 */
export async function syncModels(
  organisationId: string
): Promise<SyncModelsResult> {
  try {
    // Fetch suggestions first
    const suggestionsResponse = await fetch(
      "https://service-marketplace.perlecto.de/api/v1/models/suggestions"
    );
    const suggestionsData: { suggestions: string[] } =
      await suggestionsResponse.json();
    const activeModelNames = new Set(suggestionsData.suggestions || []);

    // Fetch both current organisation models and public models
    const [orgModels, publicModelsResponse] = await Promise.all([
      getAllAiProviderModels(organisationId),
      fetch("https://service-marketplace.perlecto.de/api/v1/models").then(
        (res) => res.json()
      ),
    ]);

    // Convert public models response to array
    const publicModels: PublicAIModel[] = Object.values(
      publicModelsResponse as PublicModelsResponse
    );

    if (!publicModels) {
      throw new Error("Failed to fetch public models");
    }

    // Find models to add (public models not in org models)
    const modelsToAdd: AiProviderModelsInsert[] = [];

    for (const publicModel of publicModels) {
      const exists = orgModels.find(
        (m: AiProviderModelsSelect) => m.name === publicModel.name && m.system
      );

      if (!exists) {
        modelsToAdd.push({
          organisationId,
          name: publicModel.name,
          provider: publicModel.provider,
          model: publicModel.model,
          inputType: publicModel.inputType,
          outputType: publicModel.outputType,
          label: publicModel.label,
          description: publicModel.description,
          maxTokens: publicModel.maxTokens,
          maxOutputTokens: publicModel.maxOutputTokens,
          endpoint: publicModel.endpoint,
          hostingOrigin: publicModel.hostingOrigin,
          usesInternet: publicModel.usesInternet,
          active: activeModelNames.has(publicModel.name),
          showForUser: publicModel.showForUser,
          supportsToolCalling: publicModel.supportsToolCalling,
          supportsStreaming: publicModel.supportsStreaming,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          system: true,
        });
      } else {
        // Update existing model
        await updateAiProviderModel(organisationId, exists.id, {
          inputType: publicModel.inputType,
          outputType: publicModel.outputType,
          maxTokens: publicModel.maxTokens,
          maxOutputTokens: publicModel.maxOutputTokens,
          endpoint: publicModel.endpoint,
          hostingOrigin: publicModel.hostingOrigin,
          usesInternet: publicModel.usesInternet,
          showForUser: publicModel.showForUser,
          supportsToolCalling: publicModel.supportsToolCalling,
          supportsStreaming: publicModel.supportsStreaming,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Find system models to remove (org system models not in public models)
    const modelsToRemove = orgModels.filter(
      (orgModel: AiProviderModelsSelect) => {
        if (!orgModel.system) return false;
        return !publicModels.some((pm) => pm.name === orgModel.name);
      }
    );

    // Remove obsolete system models
    for (const modelToRemove of modelsToRemove) {
      await deleteAiProviderModel(organisationId, modelToRemove.id);
    }

    // Add new models
    for (const modelToAdd of modelsToAdd) {
      await createAiProviderModel(modelToAdd);
    }

    return {
      added: modelsToAdd.length,
      removed: modelsToRemove.length,
    };
  } catch (error) {
    console.error("Error syncing models:", error);
    throw new HTTPException(500, {
      message: "Failed to sync AI provider models: " + error,
    });
  }
}
