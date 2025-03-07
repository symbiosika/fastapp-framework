import { providers } from "../index";
import type { AIProvider } from "../types";

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
