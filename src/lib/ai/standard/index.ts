import OpenAIClient from "openai";
import fs from "fs/promises";
import log from "../../log";
import { basename } from "path";
import type { WhisperResponseWithSegmentsAndWords } from "../../types/openai";
import { nanoid } from "nanoid";
import * as v from "valibot";

/*
This library is a wrapper for LLM APIs.
At the moment it only supports OpenAI.
All functions should be designed to support different providers in the future!
*/

/**
 * Define validations
 */
export const aiProviderValidationSchema = v.object({
  provider: v.union([v.literal("openai"), v.literal("mistral")]),
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
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const VISION_MODEL = "gpt-4o-mini";
export const TEXT_MODEL = "gpt-4o-mini";
export const FAST_TEXT_MODEL = "gpt-4o-mini";
export const TTS_MODEL = "tts-1";
export const STT_MODEL = "whisper-1";
export const IMAGE_GENERATION_MODEL = "dall-e-3";

interface Model {
  name: string;
  label: string;
  description?: string;
  endpoint: string;
  provider: string;
  providerName: string;
  maxTokens?: number;
  maxOutputTokens?: number;
}

interface Provider {
  [key: string]: Model;
}

interface MessageContent {
  type: string;
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: MessageContent[] | string;
}

interface ProviderToken {
  [key: string]: string;
}

/**
 * All available models
 * OpenAI: https://platform.openai.com/docs/models
 * Mistral: https://docs.mistral.ai/getting-started/models/models_overview/
 */
const TextModels: Provider = {
  "openai:gpt-4": {
    name: "gpt-4",
    label: "GPT-4",
    provider: "openai",
    providerName: "OpenAI",
    maxTokens: 8192, // Approximate context limit
    maxOutputTokens: 8192, // Reasonable output limit within context
    endpoint: "https://api.openai.com/v1/chat/completions",
  },
  "openai:gpt-4-turbo": {
    name: "gpt-4-turbo",
    label: "GPT-4 Turbo",
    provider: "openai",
    providerName: "OpenAI",
    maxTokens: 128000,
    maxOutputTokens: 4096,
    endpoint: "https://api.openai.com/v1/chat/completions",
  },
  // "openai:gpt-3.5-turbo": {
  //   name: "gpt-3.5-turbo",
  //   label: "GPT-3.5 Turbo",
  //   provider: "openai",
  //   providerName: "OpenAI",
  //   maxTokens: 16385,
  //   maxOutputTokens: 4096,
  //   endpoint: "https://api.openai.com/v1/chat/completions",
  // },
  "openai:gpt-4o": {
    name: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    providerName: "OpenAI",
    maxTokens: 128000,
    maxOutputTokens: 16384,
    endpoint: "https://api.openai.com/v1/chat/completions",
  },
  "openai:gpt-4o-mini": {
    name: "gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "openai",
    providerName: "OpenAI",
    maxTokens: 128000,
    maxOutputTokens: 16384,
    endpoint: "https://api.openai.com/v1/chat/completions",
  },
  // "openai:o1": {
  //   name: "o1",
  //   label: "GPT o1",
  //   provider: "openai",
  //   providerName: "OpenAI",
  //   maxTokens: 200000,
  //   maxOutputTokens: 100000,
  //   endpoint: "https://api.openai.com/v1/chat/completions",
  // },
  // "openai:o1-mini": {
  //   name: "o1-mini",
  //   label: "GPT o1 Mini",
  //   provider: "openai",
  //   providerName: "OpenAI",
  //   maxTokens: 128000,
  //   maxOutputTokens: 65536,
  //   endpoint: "https://api.openai.com/v1/chat/completions",
  // },

  "anthropic:claude-3-5-sonnet-latest": {
    name: "claude-3-5-sonnet-latest",
    label: "Claude 3.5 Sonnet",
    description: "The Top model from Anthropic",
    provider: "anthropic",
    providerName: "Anthropic",
    maxTokens: 200000,
    maxOutputTokens: 8192,
    endpoint: "https://api.anthropic.com/v1/messages",
  },
  "anthropic:claude-3-5-haiku-latest": {
    name: "claude-3-5-haiku-latest",
    label: "Claude 3.5 Haiku",
    description: "The fastest model from Anthropic",
    provider: "anthropic",
    providerName: "Anthropic",
    maxTokens: 200000,
    maxOutputTokens: 8192,
    endpoint: "https://api.anthropic.com/v1/messages",
  },

  "mistral:mistral-large-latest": {
    name: "mistral-large-latest",
    label: "Mistral Large",
    description: "The Top model from Mistral",
    provider: "mistral",
    providerName: "Mistral",
    maxTokens: 128000,
    maxOutputTokens: 4096,
    endpoint: "https://api.mistral.ai/v1/chat/completions",
  },
  "mistral:mistral-small-latest": {
    name: "mistral-small-latest",
    label: "Mistral Small",
    description: "The smallest model from Mistral",
    provider: "mistral",
    providerName: "Mistral",
    maxTokens: 128000,
    maxOutputTokens: 4096,
    endpoint: "https://api.mistral.ai/v1/chat/completions",
  },
  "mistral:ministral-8b-latest": {
    name: "ministral-8b-latest",
    label: "Mistral 8B",
    description: "The 8B model from Mistral",
    provider: "mistral",
    providerName: "Mistral",
    maxTokens: 128000,
    maxOutputTokens: 4096,
    endpoint: "https://api.mistral.ai/v1/chat/completions",
  },
  "mistral:codestral-latest": {
    name: "codestral-latest",
    label: "Mistral Code",
    description: "The Code model from Mistral",
    provider: "mistral",
    providerName: "Mistral",
    maxTokens: 128000,
    maxOutputTokens: 4096,
    endpoint: "https://api.mistral.ai/v1/chat/completions",
  },
};

const MultiModalModels: Provider = {
  "openai:gpt-4o": {
    name: "gpt-4o",
    label: "GPT-4o",
    description: "The Top model from OpenAI",
    provider: "openai",
    providerName: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
  },

  "mistral:pixtral-large-latest": {
    name: "pixtral-large-latest",
    label: "Pixtral Large",
    description: "The Top model from Mistral",
    provider: "mistral",
    providerName: "Mistral",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
  },

  "anthropic:claude-3-5-sonnet": {
    name: "claude-3-5-sonnet-latest",
    label: "Claude 3.5 Sonnet",
    description: "The Top model from Anthropic",
    provider: "anthropic",
    providerName: "Anthropic",
    endpoint: "https://api.anthropic.com/v1/messages",
  },
};

const TTSModels: Provider = {
  "openai:tts-1": {
    name: "tts-1",
    label: "TTS",
    provider: "openai",
    providerName: "OpenAI",
    endpoint: "https://api.openai.com/v1/audio/speech",
  },
};

const STTModels: Provider = {
  "openai:whisper-1": {
    name: "whisper-1",
    label: "Whisper",
    provider: "openai",
    providerName: "OpenAI",
    endpoint: "https://api.openai.com/v1/audio/transcriptions",
  },
};

const ImageGenerationModels: Provider = {
  "openai:dall-e-3": {
    name: "dall-e-3",
    label: "Dall-E 3",
    provider: "openai",
    providerName: "OpenAI",
    endpoint: "https://api.openai.com/v1/images/generations",
  },
};

const providerTokens: ProviderToken = {
  openai: process.env.OPENAI_API_KEY ?? "",
  mistral: process.env.MISTRAL_API_KEY ?? "",
  llama: process.env.LLAMA_CLOUD_API_KEY ?? "",
  anthropic: process.env.ANTHROPIC_API_KEY ?? "",
};

export const openaiClient = new OpenAIClient({
  baseURL: "https://api.openai.com/v1",
  apiKey: providerTokens.openai,
});

const mistralClient = new OpenAIClient({
  baseURL: "https://api.mistral.ai/v1",
  apiKey: providerTokens.mistral,
});

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
 * Get a providers token
 */
export const getProviderToken = (provider: string) => {
  if (!providerTokens[provider]) {
    throw new Error(`Provider token for ${provider} not found`);
  }
  return providerTokens[provider];
};

/**
 * A helper to get a model by its name in the format of "provider:model"
 */
export const getChatModel = (name: string): Model => {
  const modelInfo = TextModels[name as keyof typeof TextModels];
  if (!modelInfo) {
    throw new Error(`Model ${name} not found`);
  }
  return modelInfo;
};

/**
 * Generate an embedding for the given text
 */
export async function generateEmbedding(
  text: string,
  embeddingModel: string = EMBEDDING_MODEL
) {
  const response = await openaiClient.embeddings.create({
    model: embeddingModel,
    input: text,
    encoding_format: "float",
  });
  return {
    embedding: response.data[0].embedding,
    model: EMBEDDING_MODEL,
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
  model: string = VISION_MODEL
) {
  try {
    const base64Image = await encodeImageFromFile(image);
    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
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
      ],
      max_tokens: 2000,
    });

    return response.choices[0].message.content ?? "";
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
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    outputType?: "text" | "json";
  }
): Promise<string> {
  try {
    const model = getChatModel(options?.model ?? "openai:gpt-4-turbo");
    const token = getProviderToken(model.provider);
    // API Call
    const req =
      model.provider === "anthropic"
        ? {
            model: model.name,
            max_tokens: options?.maxTokens ?? undefined,
            messages: messages.map((msg) => ({
              role: msg.role === "assistant" ? "assistant" : "user",
              content: msg.content,
            })),
            temperature: options?.temperature ?? 1,
          }
        : {
            model: model.name,
            temperature: options?.temperature ?? 1,
            stream: false,
            messages: messages,
            max_tokens: options?.maxTokens ?? undefined,
            response_format:
              options?.outputType === "json"
                ? { type: "json_object" }
                : { type: "text" },
            n: 1,
            safe_prompt: model.provider === "mistral" ? false : undefined,
          };
    const r = await fetch(model.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(req),
    });
    if (r.status !== 200) {
      throw new Error(`API returned status ${r.status}`);
    }
    const completion = await r.json();

    const newText = completion.choices[0].message.content ?? "";
    return newText;
  } catch (error) {
    log.error(`Error in chatCompletion: ${error}`);
    throw new Error("Failed to generate text");
  }
}

/**
 * Helper to count all real words in a string
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Long Text Generation with ChatCompletion
 * Generates text longer than the max_tokens limit by iteratively appending outputs
 */
export async function generateLongText(
  messages: Message[],
  options?: {
    outputType?: "text" | "json";
    desiredWords?: number;
    maxRetries?: number;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<{
  text: string;
  json?: any;
}> {
  let output = "";
  let currentMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  let retryCount = 0;
  let finished = false;

  while (!finished) {
    try {
      const model = getChatModel(options?.model ?? "openai:gpt-4-turbo");
      const token = getProviderToken(model.provider);

      // API Call depending on the provider
      let req;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (model.provider === "anthropic") {
        req = {
          model: model.name,
          max_tokens: options?.maxTokens ?? 4096,
          messages: currentMessages.map((msg) => ({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: msg.content,
          })),
          temperature: options?.temperature ?? 1,
        };
        headers["x-api-key"] = token;
        headers["anthropic-version"] = "2023-06-01";
      } else if (model.provider === "mistral") {
        req = {
          model: model.name,
          temperature: options?.temperature ?? 1,
          stream: false,
          messages: currentMessages,
          max_tokens: options?.maxTokens ?? undefined,
          safe_prompt: false,
          n: 1,
        };
        headers["Authorization"] = `Bearer ${token}`;
      } else if (model.provider === "openai") {
        req = {
          model: model.name,
          temperature: options?.temperature ?? 1,
          stream: false,
          messages: currentMessages,
          max_tokens: options?.maxTokens ?? undefined,
          n: 1,
        };
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        throw new Error(`Provider ${model.provider} not supported`);
      }

      // console.log("POST", model.endpoint, req);
      const r = await fetch(model.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(req),
      });
      if (r.status !== 200) {
        const errorText = await r.text();
        log.error("Error in generateLongText", errorText);
        log.error("Request", req);
        throw new Error(`API returned status ${r.status}`);
      }
      const completion = await r.json();
      // console.log("completion", completion);

      let newText = "";
      if (model.provider === "anthropic") {
        newText = completion.content[0].text ?? "";
      } else if (model.provider === "mistral") {
        newText = completion.choices[0].message.content ?? "";
      } else if (model.provider === "openai") {
        newText = completion.choices[0].message.content ?? "";
      }

      output += newText;

      // Update messages to include the assistant's reply and a prompt to continue
      currentMessages.push({
        role: "assistant",
        content: newText,
      });

      // Add a user message to prompt continuation if needed
      if (options?.desiredWords && countWords(output) < options.desiredWords) {
        log.debug(
          `ChatCompletionLongText: ${countWords(output)}/${options.desiredWords} words, continuing...`
        );
        currentMessages.push({
          role: "user",
          content: `You reached ${countWords(output)} of ${options.desiredWords} desired words. Please continue in the same language as the text. Don't repeat yourself.`,
        });
      } else {
        log.debug(
          `ChatCompletionLongText: finished after ${retryCount} retries`
        );
        finished = true;
      }
    } catch (error) {
      log.error(`chatCompletionLongText: ${error}`);
      retryCount++;
      if (options?.maxRetries && retryCount >= options.maxRetries) {
        throw new Error("Failed to generate text after maximum retries");
      }
      if (!options?.maxRetries) {
        finished = true;
        throw new Error("Stopped to generate text after. " + error);
      }
    }
  }

  let parsedJson: any;
  if (options?.outputType === "json") {
    try {
      parsedJson = JSON.parse(output);
      return {
        text: output,
        json: parsedJson,
      };
    } catch (error) {
      log.error(`Error parsing JSON: ${error}. Output: ${output}`);
      throw new Error(
        `Result could not be parsed as JSON. Please check the Logs.`
      );
    }
  } else {
    return {
      text: output,
    };
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
  model: string = STT_MODEL
) => {
  let fileToUpload: File;
  if (query.file) {
    fileToUpload = query.file;
  } else if (query.filePath) {
    const fileBuffer = await fs.readFile(query.filePath);
    const fileName = basename(query.filePath);
    fileToUpload = new File([fileBuffer], fileName);
  } else {
    throw new Error("No file or filePath provided");
  }

  const createTimestampGranularities: ("segment" | "word")[] = [];
  if (query.returnSegments) {
    createTimestampGranularities.push("segment");
  }
  if (query.returnWords) {
    createTimestampGranularities.push("word");
  }

  const transcription = await openaiClient.audio.transcriptions.create({
    file: fileToUpload,
    model,
    response_format: "verbose_json",
    timestamp_granularities: createTimestampGranularities,
  });

  const r = transcription as unknown as WhisperResponseWithSegmentsAndWords;

  return r;
};

/**
 * Use OpenAI for Image Generation
 */
export const generateImage = async (
  prompt: string,
  negativePrompt: string = "",
  model: string = IMAGE_GENERATION_MODEL,
  width: number = 1024,
  height: number = 1024
) => {
  const response = await openaiClient.images.generate({
    model,
    prompt: `${prompt} ${negativePrompt ? `. It contains not ${negativePrompt}` : ""}`,
    n: 1,
    size: `${width}x${height}` as any,
  });
  const image_url = response.data[0].url;
  if (!image_url) {
    throw new Error("No image URL returned");
  }
  // download the image and save it to the images folder
  // the url will be a web url, so we need to download it
  const imageBuffer = await (await fetch(image_url)).arrayBuffer();
  return imageBuffer;
};

/**
 * Any Text to Speech
 */
export const textToSpeech = async (
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy"
): Promise<{
  file: File;
  filename: string;
}> => {
  const mp3 = await openaiClient.audio.speech.create({
    model: TTS_MODEL,
    voice,
    input: text,
  });

  const buffer = await mp3.arrayBuffer();
  const id = nanoid(16);
  const filename = `${id}.mp3`;

  const file = new File([buffer], filename, { type: "audio/mp3" });

  return {
    file,
    filename,
  };
};
