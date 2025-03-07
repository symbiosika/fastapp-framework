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

/**
 * All available models
 * OpenAI: https://platform.openai.com/docs/models
 * Mistral: https://docs.mistral.ai/getting-started/models/models_overview/
 */
const TextModels: Provider = {
  // "openai:gpt-4": {
  //   name: "openai:gpt-4",
  //   label: "GPT-4",
  //   provider: "openai",
  //   providerName: "OpenAI",
  //   description: "A good all-rounder model",
  //   maxTokens: 8192, // Approximate context limit
  //   maxOutputTokens: 8192, // Reasonable output limit within context
  //   endpoint: "https://api.openai.com/v1/chat/completions",
  //   hostingOrigin: "us",
  // },
  // "openai:gpt-4-turbo": {
  //   name: "openai:gpt-4-turbo",
  //   label: "GPT-4 Turbo",
  //   provider: "openai",
  //   providerName: "OpenAI",
  //   description: "A faster version of GPT-4",
  //   maxTokens: 128000,
  //   maxOutputTokens: 4096,
  //   endpoint: "https://api.openai.com/v1/chat/completions",
  //   hostingOrigin: "us",
  // },
  // "openai:gpt-3.5-turbo": {
  //   name: "openai:gpt-3.5-turbo",
  //   label: "GPT-3.5 Turbo",
  //   provider: "openai",
  //   providerName: "OpenAI",
  //   maxTokens: 16385,
  //   maxOutputTokens: 4096,
  //   endpoint: "https://api.openai.com/v1/chat/completions",
  // },
  "openai:gpt-4o": {
    name: "openai:gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    providerName: "OpenAI",
    description: "OpenAI's High-End Model.",
    maxTokens: 128000,
    maxOutputTokens: 16384,
    endpoint: "https://api.openai.com/v1/chat/completions",
    hostingOrigin: "us",
    usesInternet: false,
  },
  "openai:gpt-4o-mini": {
    name: "openai:gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "openai",
    providerName: "OpenAI",
    description: "OpenAI's Fast Model.",
    maxTokens: 128000,
    maxOutputTokens: 16384,
    endpoint: "https://api.openai.com/v1/chat/completions",
    hostingOrigin: "us",
    usesInternet: false,
  },
  // "openai:o1": {
  //   name: "openai:o1",
  //   label: "GPT o1",
  //   provider: "openai",
  //   providerName: "OpenAI",
  //   description: "The Top reasoning model from OpenAI",
  //   maxTokens: 200000,
  //   maxOutputTokens: 100000,
  //   endpoint: "https://api.openai.com/v1/chat/completions",
  //   hostingOrigin: "us",
  //   usesInternet: false,
  // },
  // "openai:o1-mini": {
  //   name: "openai:o1-mini",
  //   label: "GPT o1 Mini",
  //   provider: "openai",
  //   providerName: "OpenAI",
  //   description: "A smaller reasoning model of GPT o1",
  //   maxTokens: 128000,
  //   maxOutputTokens: 65536,
  //   endpoint: "https://api.openai.com/v1/chat/completions",
  //   hostingOrigin: "us",
  //   usesInternet: false,
  // },

  "anthropic:claude-3-7-sonnet-latest": {
    name: "anthropic:claude-3-7-sonnet-latest",
    label: "Claude 3.7 Sonnet",
    description: "High-End Model from Anthropic.",
    provider: "anthropic",
    providerName: "Anthropic",
    maxTokens: 200000,
    maxOutputTokens: 8192,
    endpoint: "https://api.anthropic.com/v1/messages",
    hostingOrigin: "us",
    usesInternet: false,
  },
  "anthropic:claude-3-5-haiku-latest": {
    name: "anthropic:claude-3-5-haiku-latest",
    label: "Claude 3.5 Haiku",
    description: "Anthropic's All-Rounder Model.",
    provider: "anthropic",
    providerName: "Anthropic",
    maxTokens: 200000,
    maxOutputTokens: 8192,
    endpoint: "https://api.anthropic.com/v1/messages",
    hostingOrigin: "us",
    usesInternet: false,
  },

  "mistral:mistral-large-latest": {
    name: "mistral:mistral-large-latest",
    label: "Mistral Large",
    description: "Mistral's Top model. Hosted in Europe.",
    provider: "mistral",
    providerName: "Mistral",
    maxTokens: 128000,
    maxOutputTokens: 4096,
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    hostingOrigin: "eu",
    usesInternet: false,
  },
  // "mistral:mistral-small-latest": {
  //   name: "mistral-small-latest",
  //   label: "Mistral Small",
  //   description: "The smallest model from Mistral",
  //   provider: "mistral",
  //   providerName: "Mistral",
  //   maxTokens: 128000,
  //   maxOutputTokens: 4096,
  //   endpoint: "https://api.mistral.ai/v1/chat/completions",
  //   hostingOrigin: "eu",
  //   usesInternet: false,
  // },
  "mistral:ministral-8b-latest": {
    name: "mistral:ministral-8b-latest",
    label: "Mistral 8B",
    description: "Very fast model from Mistral. Hosted in Europe.",
    provider: "mistral",
    providerName: "Mistral",
    maxTokens: 128000,
    maxOutputTokens: 4096,
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    hostingOrigin: "eu",
    usesInternet: false,
  },
  // "mistral:codestral-latest": {
  //   name: "mistral:codestral-latest",
  //   label: "Mistral Code",
  //   description: "The Code model from Mistral",
  //   provider: "mistral",
  //   providerName: "Mistral",
  //   maxTokens: 128000,
  //   maxOutputTokens: 4096,
  //   endpoint: "https://api.mistral.ai/v1/chat/completions",
  //   hostingOrigin: "eu",
  //   usesInternet: false,
  // },

  // "perplexity:sonar": {
  //   name: "perplexity:sonar",
  //   label: "Sonar",
  //   description: "The medium model from Perplexity",
  //   provider: "perplexity",
  //   providerName: "Perplexity",
  //   maxTokens: 128000,
  //   maxOutputTokens: 4096,
  //   endpoint: "https://api.perplexity.ai/chat/completions",
  //   hostingOrigin: "us",
  //   usesInternet: false,
  // },
  "perplexity:sonar-pro": {
    name: "perplexity:sonar-pro",
    label: "Sonar Pro",
    description: "The pro model from Perplexity",
    provider: "perplexity",
    providerName: "Perplexity",
    maxTokens: 128000,
    maxOutputTokens: 8000,
    endpoint: "https://api.perplexity.ai/chat/completions",
    hostingOrigin: "us",
    usesInternet: true,
  },
  // "perplexity:sonar-reasoning": {
  //   name: "perplexity:sonar-reasoning",
  //   label: "Sonar Reasoning",
  //   description: "The reasoning model from Perplexity",
  //   provider: "perplexity",
  //   providerName: "Perplexity",
  //   maxTokens: 128000,
  //   maxOutputTokens: 8000,
  //   endpoint: "https://api.perplexity.ai/chat/completions",
  //   hostingOrigin: "us",
  //   usesInternet: true,
  // },
  "perplexity:sonar-reasoning-pro": {
    name: "perplexity:sonar-reasoning-pro",
    label: "Sonar Reasoning Pro",
    description: "Perplexity's reasoning pro model.",
    provider: "perplexity",
    providerName: "Perplexity",
    maxTokens: 128000,
    maxOutputTokens: 8000,
    endpoint: "https://api.perplexity.ai/chat/completions",
    hostingOrigin: "us",
    usesInternet: true,
  },
  "perplexity:sonar-deep-research": {
    name: "perplexity:sonar-deep-research",
    label: "Sonar Deep Research",
    description: "Deep internet research by Perplexity.",
    provider: "perplexity",
    providerName: "Perplexity",
    maxTokens: 128000,
    maxOutputTokens: 8000,
    endpoint: "https://api.perplexity.ai/chat/completions",
    hostingOrigin: "us",
    usesInternet: true,
  },
};

const MultiModalModels: Provider = {
  "openai:gpt-4o": {
    name: "openai:gpt-4o",
    label: "GPT-4o",
    description: "The Top model from OpenAI",
    provider: "openai",
    providerName: "OpenAI",
    maxTokens: 128000,
    maxOutputTokens: 16384,
    endpoint: "https://api.openai.com/v1/chat/completions",
    hostingOrigin: "us",
    usesInternet: false,
  },

  "mistral:pixtral-large-latest": {
    name: "mistral:pixtral-large-latest",
    label: "Pixtral Large",
    description: "The Top model from Mistral",
    provider: "mistral",
    providerName: "Mistral",
    maxTokens: 128000,
    maxOutputTokens: 16384,
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    hostingOrigin: "eu",
    usesInternet: false,
  },

  "anthropic:claude-3-5-sonnet": {
    name: "anthropic:claude-3-5-sonnet",
    label: "Claude 3.5 Sonnet",
    description: "The Top model from Anthropic",
    provider: "anthropic",
    providerName: "Anthropic",
    maxTokens: 128000,
    maxOutputTokens: 16384,
    endpoint: "https://api.anthropic.com/v1/messages",
    hostingOrigin: "us",
    usesInternet: false,
  },

  "perplexity:sonar-medium-online": {
    name: "perplexity:sonar-medium-online",
    label: "Sonar Medium",
    description: "The medium model from Perplexity",
    provider: "perplexity",
    providerName: "Perplexity",
    maxTokens: 128000,
    maxOutputTokens: 16384,
    endpoint: "https://api.perplexity.ai/chat/completions",
    hostingOrigin: "us",
    usesInternet: true,
  },
};

const TTSModels: Provider = {
  "openai:tts-1": {
    name: "openai:tts-1",
    label: "TTS",
    description: "The good all-rounder model from OpenAI",
    provider: "openai",
    providerName: "OpenAI",
    maxTokens: 128000,
    maxOutputTokens: 16384,
    endpoint: "https://api.openai.com/v1/audio/speech",
    hostingOrigin: "us",
    usesInternet: false,
  },
};

const STTModels: Provider = {
  "openai:whisper-1": {
    name: "openai:whisper-1",
    label: "Whisper",
    description: "The good all-rounder model from OpenAI",
    provider: "openai",
    providerName: "OpenAI",
    maxTokens: 128000,
    maxOutputTokens: 16384,
    endpoint: "https://api.openai.com/v1/audio/transcriptions",
    hostingOrigin: "us",
    usesInternet: false,
  },
};

const ImageGenerationModels: Provider = {
  "openai:dall-e-3": {
    name: "openai:dall-e-3",
    label: "Dall-E 3",
    description: "The good all-rounder model from OpenAI",
    provider: "openai",
    providerName: "OpenAI",
    maxTokens: 128000,
    maxOutputTokens: 16384,
    endpoint: "https://api.openai.com/v1/images/generations",
    hostingOrigin: "us",
    usesInternet: false,
  },
};

export const providers: Record<string, AIProvider> = {};

const registerProvider = (name: string, provider: AIProvider) => {
  providers[name] = provider;
};

registerProvider("openai", openaiProvider);
registerProvider("mistral", mistralProvider);
registerProvider("anthropic", anthropicProvider);
registerProvider("perplexity", perplexityProvider);

/**
 * Get all available AI models
 */
export const getAllAIModels = async (): Promise<{
  chat: Provider;
  multiModal: Provider;
  tts: Provider;
  stt: Provider;
  imageGeneration: Provider;
}> => {
  return {
    chat: TextModels,
    multiModal: MultiModalModels,
    tts: TTSModels,
    stt: STTModels,
    imageGeneration: ImageGenerationModels,
  };
};

/**
 * A helper to get a model by its name in the format of "provider:model"
 */
export const getChatModel = (name?: string): Model => {
  if (!name) {
    return TextModels[DEFAULT_MODEL as keyof typeof TextModels];
  }
  const modelInfo = TextModels[name as keyof typeof TextModels] ?? null;
  if (!modelInfo) {
    return TextModels[DEFAULT_MODEL as keyof typeof TextModels];
  }
  return modelInfo;
};

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
 * Helper to encode the given image as a base64 string.
 */
async function encodeImageFromPath(imagePath: string): Promise<string> {
  const imageBuffer = await fs.readFile(imagePath);
  return Buffer.from(imageBuffer).toString("base64");
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
