import fs from "fs/promises";
import log from "../../log";
import type { WhisperResponseWithSegmentsAndWords } from "../../types/openai";
import * as v from "valibot";
import { getProvider } from "./providers";

// Import all providers to ensure they are registered
import "./providers/openai";
import "./providers/anthropic";
import "./providers/mistral";
import "./providers/perplexity";
import openaiProvider from "./providers/openai";
import anthropicProvider from "./providers/anthropic";
import mistralProvider from "./providers/mistral";
import perplexityProvider from "./providers/perplexity";
import type {
  Provider,
  Model,
  Message,
  AIProvider,
  TextGenerationOptions,
  LongTextGenerationOptions,
} from "./types";

/*
This library is a wrapper for LLM APIs.
It supports OpenAI, Anthropic, Mistral, and Perplexity.
All functions are designed to support different providers!
*/

/**
 * Define validations
 */
export const aiProviderValidationSchema = v.object({
  provider: v.union([
    v.literal("openai"),
    v.literal("mistral"),
    v.literal("anthropic"),
    v.literal("perplexity"),
  ]),
  model: v.string(),
});

export const aiModelsValidationSchema = v.object({
  chat: v.array(aiProviderValidationSchema),
  multiModal: v.array(aiProviderValidationSchema),
  tts: v.array(aiProviderValidationSchema),
  stt: v.array(aiProviderValidationSchema),
  imageGeneration: v.array(aiProviderValidationSchema),
});

/**
 * Define the standards
 */
export const EMBEDDING_MODEL = "openai:text-embedding-3-small";
export const VISION_MODEL = "openai:gpt-4o-mini";
export const TEXT_MODEL = "openai:gpt-4o-mini";
export const FAST_TEXT_MODEL = "openai:gpt-4o-mini";
export const TTS_MODEL = "openai:tts-1";
export const STT_MODEL = "openai:whisper-1";
export const IMAGE_GENERATION_MODEL = "openai:dall-e-3";
export const DEFAULT_MODEL = "openai:gpt-4o-mini";

export const providers: Record<string, AIProvider> = {};

const registerProvider = (name: string, provider: AIProvider) => {
  providers[name] = provider;
};

registerProvider("openai", openaiProvider);
registerProvider("mistral", mistralProvider);
registerProvider("anthropic", anthropicProvider);
registerProvider("perplexity", perplexityProvider);

/**
 * Helper to parse a model string in the format "provider:model"
 */
export const parseModelString = (
  modelString: string = DEFAULT_MODEL
): { provider: string; model: string } => {
  const parts = modelString.split(":");
  if (parts.length !== 2) {
    const defaultParts = DEFAULT_MODEL.split(":");
    return { provider: defaultParts[0], model: defaultParts[1] };
  }
  return { provider: parts[0], model: parts[1] };
};

/**
 * Generate an embedding for the given text
 */
export async function generateEmbedding(
  text: string,
  embeddingModel: string = EMBEDDING_MODEL
) {
  const { provider, model } = parseModelString(embeddingModel);

  // For now, only OpenAI supports embeddings in our implementation
  const result = await getProvider(provider).generateEmbedding!(text, {
    model,
  });

  return {
    embedding: result.embedding,
    model: result.model,
  };
}

/**
 * Helper to encode a File object as a base64 string.
 */
async function encodeImageFromFile(file: File): Promise<string> {
  const imageBuffer = await file.arrayBuffer();
  return Buffer.from(imageBuffer).toString("base64");
}

/**
 * Generate a description for the given image using the OpenAI API.
 */
export async function generateImageDescription(
  image: File,
  modelString: string = `openai:${VISION_MODEL}`
) {
  try {
    const { provider, model } = parseModelString(modelString);
    const base64Image = await encodeImageFromFile(image);

    // Create a multimodal message with the image
    const messages: Message[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "What's in this image? Explain it in detail with as many details as possible.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ];

    const result = await getProvider(provider).generateText(messages, {
      model,
    });
    return result.text;
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
  messages: Message[],
  options?: TextGenerationOptions & { model?: string }
): Promise<string> {
  try {
    const modelString = options?.model ?? DEFAULT_MODEL;
    const { provider, model } = parseModelString(modelString);

    const result = await getProvider(provider).generateText(messages, {
      ...options,
      model,
    });

    return result.text;
  } catch (error) {
    log.error(`Error in chatCompletion: ${error}`);
    throw new Error("Failed to generate text");
  }
}

/**
 * Long Text Generation with ChatCompletion
 * Generates text longer than the max_tokens limit by iteratively appending outputs
 */
export async function generateLongText(
  messages: Message[],
  options?: LongTextGenerationOptions & { model?: string }
): Promise<{
  text: string;
  json?: any;
  meta: {
    model: string;
    provider: string;
    thinkings?: string[];
    citations?: string[];
  };
}> {
  try {
    const modelString = options?.model ?? DEFAULT_MODEL;
    const { provider, model } = parseModelString(modelString);

    const result = await getProvider(provider).generateLongText(messages, {
      ...options,
      model,
    });

    return {
      text: result.text,
      json: result.json,
      meta: {
        ...result.meta,
      },
    };
  } catch (error) {
    log.error(`Error in generateLongText: ${error}`);
    throw new Error("Failed to generate long text");
  }
}

/**
 * Use OpenAI for STT
 */
export const speechToText = async (
  query: {
    file?: File;
    filePath?: string;
    returnSegments?: boolean;
    returnWords?: boolean;
  },
  modelString: string = STT_MODEL
) => {
  try {
    const { provider, model } = parseModelString(modelString);

    // Currently only OpenAI supports STT in our implementation
    if (provider !== "openai") {
      throw new Error(`Provider ${provider} does not support speech-to-text`);
    }

    let audioData: File | string;
    if (query.file) {
      audioData = query.file;
    } else if (query.filePath) {
      audioData = query.filePath;
    } else {
      throw new Error("No file or filePath provided");
    }

    const result = await getProvider(provider).speechToText!(audioData, {
      model,
      returnSegments: query.returnSegments,
      returnWords: query.returnWords,
    });

    return result as unknown as WhisperResponseWithSegmentsAndWords;
  } catch (error) {
    log.error(`Error in speechToText: ${error}`);
    throw new Error("Failed to convert speech to text");
  }
};

/**
 * Use OpenAI for Image Generation
 */
export const generateImage = async (
  prompt: string,
  negativePrompt: string = "",
  modelString: string = `openai:${IMAGE_GENERATION_MODEL}`,
  width: number = 1024,
  height: number = 1024
) => {
  try {
    const { provider, model } = parseModelString(modelString);

    // Currently only OpenAI supports image generation in our implementation
    if (provider !== "openai") {
      throw new Error(`Provider ${provider} does not support image generation`);
    }

    const result = await getProvider(provider).generateImage!(prompt, {
      model,
      negativePrompt,
      width,
      height,
    });

    return result.imageBuffer;
  } catch (error) {
    log.error(`Error in generateImage: ${error}`);
    throw new Error("Failed to generate image");
  }
};

/**
 * Any Text to Speech
 */
export const textToSpeech = async (
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  modelString: string = TTS_MODEL
): Promise<{
  file: File;
  filename: string;
}> => {
  try {
    const { provider, model } = parseModelString(modelString);

    // Currently only OpenAI supports TTS in our implementation
    if (provider !== "openai") {
      throw new Error(`Provider ${provider} does not support text-to-speech`);
    }

    const result = await getProvider(provider).textToSpeech!(text, {
      model,
      voice,
    });

    return {
      file: result.file,
      filename: result.filename,
    };
  } catch (error) {
    log.error(`Error in textToSpeech: ${error}`);
    throw new Error("Failed to convert text to speech");
  }
};
