import { CoreMessage, embed, generateText } from "ai";
import { UserContext } from "./types";
import { getAIEmbeddingModel, getAIModel } from "./get-model";
import { encodeImageFromFile } from "./utils";
import log from "../../log";
import { LanguageModelV1 } from "ai";

/**
 * Generate an embedding for the given text using AI SDK
 */
export async function generateEmbedding(
  text: string,
  context: UserContext,
  providerAndModelName?: string
) {
  if (!text || text.trim() === "") {
    throw new Error("Text is required");
  }

  if (!providerAndModelName) {
    providerAndModelName =
      process.env.DEFAULT_EMBEDDING_MODEL ?? "openai:text-embedding-3-small";
  }

  const model = await getAIEmbeddingModel(providerAndModelName, context);
  const { embedding } = await embed({
    model,
    value: text,
  });

  log.logToDB({
    level: "info",
    organisationId: context?.organisationId,
    sessionId: context?.userId,
    source: "ai",
    category: "embedding",
    message: "generate-embedding-complete",
    metadata: {
      model: providerAndModelName,
      embeddingLength: embedding.length,
    },
  });

  return {
    embedding,
    model: providerAndModelName,
  };
}

/**
 * Generate a description for the given image using AI SDK
 */
export async function generateImageDescription(
  image: File,
  context: UserContext,
  providerAndModelName?: string
) {
  try {
    if (!providerAndModelName) {
      providerAndModelName =
        process.env.DEFAULT_IMAGE_DESCRIPTION_MODEL ?? "openai:gpt-4o-mini";
    }

    const model = await getAIModel(providerAndModelName, context);
    const base64Image = await encodeImageFromFile(image);
    const contentType = image.type || "image/jpeg";

    const result = await generateText({
      model: model as LanguageModelV1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What's in this image? Explain it in detail with as many details as possible.",
            },
            {
              type: "image",
              image: `data:${contentType};base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    log.logToDB({
      level: "info",
      organisationId: context?.organisationId,
      sessionId: context?.userId,
      source: "ai",
      category: "image-description",
      message: "generate-image-description-complete",
      metadata: {
        model: providerAndModelName,
        descriptionLength: result.text.length,
      },
    });

    return {
      text: result.text,
      model: providerAndModelName,
    };
  } catch (error) {
    log.error(`Error in generateImageDescription: ${error}`);
    throw new Error("Failed to generate image description");
  }
}

/**
 * ChatCompletion function to generate a response for the given prompt.
 * Will respond with plain Text only.
 */
export async function chatCompletion(
  messages: CoreMessage[],
  context: UserContext,
  options?: {
    providerAndModelName?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  let providerAndModelName = options?.providerAndModelName;
  if (!providerAndModelName) {
    providerAndModelName =
      process.env.DEFAULT_CHAT_COMPLETION_MODEL ?? "openai:gpt-4o-mini";
  }

  const model = await getAIModel(providerAndModelName, context);
  const result = await generateText({
    model: model as LanguageModelV1,
    messages,
    ...options,
  });

  log.logToDB({
    level: "info",
    organisationId: context?.organisationId,
    sessionId: context?.userId,
    source: "ai",
    category: "text-generation",
    message: "text-generation-complete",
    metadata: {
      model: providerAndModelName,
      responseLength: result.text.length,
      usedTokens: result.usage?.totalTokens,
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
    },
  });

  return {
    text: result.text,
    model: providerAndModelName,
    meta: {
      responseLength: result.text.length,
      usedTokens: result.usage?.totalTokens,
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
    },
  };
}
