/**
 * Response type for the public models API
 */
export interface PublicModelsResponse {
  [key: string]: PublicAIModel;
}

/**
 * Public AI model structure from the marketplace API
 */
export interface PublicAIModel {
  name: string;
  provider: string;
  model: string;
  inputType: ("text" | "image" | "audio" | "embedding")[];
  outputType: ("text" | "image" | "audio" | "embedding")[];
  label: string;
  description: string;
  maxTokens: number;
  maxOutputTokens: number;
  endpoint: string;
  hostingOrigin: string;
  usesInternet: boolean;
  showForUser: boolean;
  supportsToolCalling: boolean;
  supportsStreaming: boolean;
}

/**
 * Result of synchronizing models
 */
export interface SyncModelsResult {
  added: number;
  removed: number;
}
