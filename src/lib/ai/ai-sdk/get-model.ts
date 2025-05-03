import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { mistral } from "@ai-sdk/mistral";
import { google } from "@ai-sdk/google";
import { azure } from "@ai-sdk/azure";
import { perplexity } from "@ai-sdk/perplexity";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  getAiProviderModelByProviderAndModel,
  getAllAiProviderModels,
} from "../models";
import type { OrganisationContext } from "./types";
import log from "../../log";

/**
 * Gets a Vercel AI SDK compatible model from a provider:model string
 *
 * @param modelString - String in format "provider:model"
 * @param getAllAiProviderModels - Function to fetch all AI provider models
 * @returns Vercel AI SDK compatible model
 * @throws Error if model is not found, not active, or provider is unsupported
 */
export const getAIModel = async (
  modelString: string,
  context: OrganisationContext
) => {
  let [providerName, modelName] = modelString.split(":");

  if (!providerName || !modelName) {
    throw new Error("Invalid model string format. Expected 'provider:model'");
  }

  if (providerName === "" || modelName === "") {
    providerName = "openai";
    modelName = "gpt-4o-mini";
  }

  // Get all models from DB
  const modelConfig = await getAiProviderModelByProviderAndModel(
    context.organisationId,
    providerName,
    modelName
  );

  // Create and return the appropriate model based on provider
  switch (providerName.toLowerCase()) {
    case "openai":
      return openai(modelName);

    case "anthropic":
      return anthropic(modelName);

    case "mistral":
      return mistral(modelName);

    case "google":
      return google(modelName);

    case "azure":
      return azure(modelName);

    case "perplexity":
      return perplexity(modelName);

    default:
      // Check if it's a custom endpoint with OpenAI compatibility
      if (
        modelConfig.endpointCompatibility === "openai" &&
        modelConfig.endpoint
      ) {
        if (!process.env[modelConfig.provider.toUpperCase() + "_API_KEY"]) {
          throw new Error(
            `API key for ${modelConfig.provider} is not set in environment variables`
          );
        }
        log.debug(
          "Creating OpenAI compatible model " +
            modelName +
            " for " +
            providerName
        );
        return createOpenAICompatible({
          baseURL: modelConfig.endpoint,
          name: providerName,
          apiKey: process.env[modelConfig.provider.toUpperCase() + "_API_KEY"],
        });
      }

      throw new Error(`Provider ${providerName} is not supported`);
  }
};

/**
 * Gets a Vercel AI SDK compatible embedding model from a provider:model string
 *
 * @param modelString - String in format "provider:model"
 * @param context - OrganisationContext
 * @returns Vercel AI SDK compatible embedding model
 * @throws Error if model is not found, not active, or provider is unsupported
 */
export const getAIEmbeddingModel = async (
  modelString: string,
  context: OrganisationContext
): Promise<ReturnType<typeof openai.textEmbeddingModel>> => {
  const [providerName, modelName] = modelString.split(":");

  if (!providerName || !modelName) {
    throw new Error("Invalid model string format. Expected 'provider:model'");
  }

  // Get all models from DB
  const allModels = await getAllAiProviderModels(context.organisationId);

  // Find the requested model
  const modelConfig = allModels.find(
    (m) => m.provider === providerName && m.model === modelName && m.active
  );

  if (!modelConfig) {
    throw new Error(`Model ${modelString} not found or not active`);
  }

  // Create and return the appropriate embedding model based on provider
  switch (providerName.toLowerCase()) {
    case "openai":
      return openai.textEmbeddingModel(modelName);

    case "anthropic":
      throw new Error("Anthropic doesn't support embeddings via AI SDK");

    case "mistral":
      return mistral.textEmbeddingModel(modelName);

    case "google":
      return google.textEmbeddingModel(modelName);

    case "azure":
      return azure.textEmbeddingModel(modelName);

    case "perplexity":
      throw new Error("Perplexity doesn't support embeddings via AI SDK");

    default:
      // Custom OpenAI-compatible endpoints might support embeddings
      if (
        modelConfig.endpointCompatibility === "openai" &&
        modelConfig.endpoint
      ) {
        if (!process.env[modelConfig.provider.toUpperCase() + "_API_KEY"]) {
          throw new Error(
            `API key for ${modelConfig.provider} is not set in environment variables`
          );
        }

        // For custom OpenAI-compatible endpoints, use the OpenAI embedding model directly
        // since createOpenAICompatible doesn't directly support embeddings
        const openaiModel = openai.embedding(modelName);

        // You might need to adapt this for custom endpoints if needed in future
        return openaiModel;
      }

      throw new Error(
        `Provider ${providerName} is not supported for embeddings`
      );
  }
};
