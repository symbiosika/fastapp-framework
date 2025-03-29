import { CoreMessage, embed, generateText } from "ai";
import { UserContext } from "./types";
import { getAIEmbeddingModel, getAIModel } from "./get-model";
import { encodeImageFromFile } from "./utils";
import log from "../../log";
import { LanguageModelV1 } from "ai";
import { nanoid } from "nanoid";
import { getToolsDictionary } from "../interaction/tools";

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
    tools?: string[];
  }
) {
  let providerAndModelName = options?.providerAndModelName;
  if (!providerAndModelName) {
    providerAndModelName =
      process.env.DEFAULT_CHAT_COMPLETION_MODEL ?? "openai:gpt-4o-mini";
  }

  const model = await getAIModel(providerAndModelName, context);

  // Build parameters for generateText
  const params: any = {
    model: model as LanguageModelV1,
    messages,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
  };

  // Add tools if provided
  if (options?.tools && options.tools.length > 0) {
    // Get tools from registry
    const toolDictionary = getToolsDictionary(options.tools);

    // Convert to format expected by AI SDK
    params.tools = toolDictionary;

    // Allow model to decide when to use tools
    params.tool_choice = "auto";

    // Allow multiple steps in conversation
    params.maxSteps = 3;
  }

  const result = await generateText(params);

  // Handle tool calls if present
  let finalText = result.text;
  let toolUsage: Array<{ toolName: string; arguments: any }> = [];

  // Track tool calls if present in the response
  if (result.toolCalls && result.toolCalls.length > 0) {
    toolUsage = result.toolCalls.map((call) => ({
      toolName: call.toolName,
      arguments: call.args,
    }));

    log.logToDB({
      level: "info",
      organisationId: context?.organisationId,
      sessionId: context?.userId,
      source: "ai",
      category: "tool-usage",
      message: "tool-call-executed",
      metadata: {
        toolCalls: toolUsage,
      },
    });
  }

  // Log completion
  log.logToDB({
    level: "info",
    organisationId: context?.organisationId,
    sessionId: context?.userId,
    source: "ai",
    category: "text-generation",
    message: "text-generation-complete",
    metadata: {
      model: providerAndModelName,
      responseLength: finalText.length,
      usedTokens: result.usage?.totalTokens,
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
      toolsUsed: toolUsage.length > 0 ? toolUsage : undefined,
    },
  });

  return {
    id: nanoid(6),
    text: finalText,
    model: providerAndModelName,
    meta: {
      responseLength: finalText.length,
      usedTokens: result.usage?.totalTokens,
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
      toolsUsed: toolUsage.length > 0 ? toolUsage : undefined,
    },
  };
}
