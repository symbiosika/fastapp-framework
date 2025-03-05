import { type Message, providers } from "../index";

export const MAXIMUM_EXTERNAL_CALL_TIMEOUT = 900 * 1000; // 15 minutes

// Common interfaces for all providers
export interface AIProvider {
  generateText(
    messages: Message[],
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse>;

  generateLongText(
    messages: Message[],
    options?: LongTextGenerationOptions
  ): Promise<LongTextGenerationResponse>;

  generateEmbedding?(
    text: string,
    options?: EmbeddingOptions
  ): Promise<EmbeddingResponse>;

  generateImage?(
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResponse>;

  speechToText?(
    audioData: File | string,
    options?: SpeechToTextOptions
  ): Promise<SpeechToTextResponse>;

  textToSpeech?(
    text: string,
    options?: TextToSpeechOptions
  ): Promise<TextToSpeechResponse>;
}

// Common options and response types
export interface TextGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  outputType?: "text" | "json";
}

export interface TextGenerationResponse {
  text: string;
  json?: any;
  meta: {
    model: string;
    provider: string;
    thinkings?: string[];
    citations?: string[];
  };
}

export interface LongTextGenerationOptions extends TextGenerationOptions {
  desiredWords?: number;
  maxRetries?: number;
}

export interface LongTextGenerationResponse extends TextGenerationResponse {}

export interface EmbeddingOptions {
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  provider: string;
}

export interface ImageGenerationOptions {
  model?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}

export interface ImageGenerationResponse {
  imageBuffer: ArrayBuffer;
  meta: {
    model: string;
    provider: string;
  };
}

export interface SpeechToTextOptions {
  model?: string;
  returnSegments?: boolean;
  returnWords?: boolean;
}

export interface SpeechToTextResponse {
  text: string;
  segments?: any[];
  words?: any[];
  meta: {
    model: string;
    provider: string;
  };
}

export interface TextToSpeechOptions {
  model?: string;
  voice?: string;
}

export interface TextToSpeechResponse {
  file: File;
  filename: string;
  meta: {
    model: string;
    provider: string;
  };
}

// Content type for multimodal messages
export interface MultiModalContent {
  type: "text" | "image" | "audio";
  text?: string;
  image_url?: {
    url: string;
  };
  audio_url?: {
    url: string;
  };
}

// Register a provider

// Get a provider
export function getProvider(name: string): AIProvider {
  if (!providers[name]) {
    throw new Error(`Provider ${name} not found`);
  }
  return providers[name];
}

// Export provider implementations
export * from "./openai";
export * from "./anthropic";
export * from "./mistral";
export * from "./perplexity";
