import log from "../../../../log";
import { MAXIMUM_EXTERNAL_CALL_TIMEOUT } from "../../standards";
import { countWords } from "../../utils";
import OpenAIClient from "openai";
import type {
  Message,
  AIProvider,
  TextGenerationOptions,
  TextGenerationResponse,
  LongTextGenerationOptions,
  LongTextGenerationResponse,
  EmbeddingResponse,
  EmbeddingOptions,
} from "../../types";

// Default models
const DEFAULT_TEXT_MODEL = "mistral-large-latest";
const DEFAULT_VISION_MODEL = "pixtral-large-latest";
const EMBEDDING_MODEL = "mistral-embed";

export class MistralProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;
  private client: OpenAIClient;

  constructor(apiKey: string, baseURL: string = "https://api.mistral.ai/v1") {
    this.apiKey = apiKey;
    this.baseURL = baseURL;

    this.client = new OpenAIClient({
      baseURL,
      apiKey,
    });
  }

  async generateEmbedding(
    text: string,
    options?: EmbeddingOptions
  ): Promise<EmbeddingResponse> {
    const model = options?.model || EMBEDDING_MODEL;

    const response = await this.client.embeddings.create({
      model,
      input: text,
      encoding_format: "float",
    });

    return {
      embedding: response.data[0].embedding,
      model,
      provider: "mistral",
    };
  }

  async generateText(
    messages: Message[],
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse> {
    try {
      const model = options?.model || DEFAULT_TEXT_MODEL;

      // Clean messages to remove meta fields that Mistral doesn't accept
      const cleanedMessages = messages.map(({ role, content }) => ({
        role,
        content,
      }));

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: options?.temperature ?? 1,
          messages: cleanedMessages,
          max_tokens: options?.maxTokens,
          safe_prompt: false,
          response_format:
            options?.outputType === "json"
              ? { type: "json_object" }
              : undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const text = result.choices[0].message.content;

      let json: any = undefined;
      if (options?.outputType === "json") {
        try {
          json = JSON.parse(text);
        } catch (error) {
          log.error(`Error parsing JSON: ${error}. Output: ${text}`);
        }
      }

      return {
        text,
        json,
        meta: {
          model,
          provider: "mistral",
          inputTokens: result.usage.prompt_tokens,
          outputTokens: result.usage.completion_tokens,
        },
      };
    } catch (error) {
      log.error(`Error in Mistral generateText: ${error}`);
      throw new Error("Failed to generate text with Mistral");
    }
  }

  async generateLongText(
    messages: Message[],
    options?: LongTextGenerationOptions
  ): Promise<LongTextGenerationResponse> {
    let output = "";
    // Clean messages to remove meta fields that Mistral doesn't accept
    let currentMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));
    let retryCount = 0;
    let finished = false;
    const model = options?.model || DEFAULT_TEXT_MODEL;

    let inputTokens = 0;
    let outputTokens = 0;

    while (!finished) {
      try {
        // Set timeout for fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          MAXIMUM_EXTERNAL_CALL_TIMEOUT
        );

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: options?.temperature ?? 1,
            messages: currentMessages,
            max_tokens: options?.maxTokens,
            safe_prompt: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Mistral API error: ${response.status} ${errorText}`);
        }

        // get the result
        const result = await response.json();
        const newText = result.choices[0].message.content;
        output += newText;

        // count the input and output tokens
        inputTokens += result.usage.prompt_tokens ?? 0;
        outputTokens += result.usage.completion_tokens ?? 0;

        // Update messages to include the assistant's reply, ensuring we only keep role and content
        currentMessages.push({
          role: "assistant",
          content: newText,
        });

        // Add a user message to prompt continuation if needed
        if (
          options?.desiredWords &&
          countWords(output) < options.desiredWords
        ) {
          log.debug(
            `Mistral LongText: ${countWords(output)}/${options.desiredWords} words, continuing...`
          );
          currentMessages.push({
            role: "user",
            content: `You reached ${countWords(output)} of ${options.desiredWords} desired words. Please continue in the same language as the text. Don't repeat yourself.`,
          });
        } else {
          log.debug(`Mistral LongText: finished after ${retryCount} retries`);
          finished = true;
        }
      } catch (error) {
        log.error(`Mistral LongText error: ${error}`);
        retryCount++;
        if (options?.maxRetries && retryCount >= options.maxRetries) {
          throw new Error("Failed to generate text after maximum retries");
        }
        if (!options?.maxRetries) {
          finished = true;
          throw new Error("Stopped generating text: " + error);
        }
      }
    }

    let json: any = undefined;
    if (options?.outputType === "json") {
      try {
        json = JSON.parse(output);
      } catch (error) {
        log.error(`Error parsing JSON: ${error}. Output: ${output}`);
        throw new Error("Result could not be parsed as JSON");
      }
    }

    return {
      text: output,
      json,
      meta: {
        model,
        provider: "mistral",
        inputTokens,
        outputTokens,
      },
    };
  }
}

// Create and register the Mistral provider
const mistralProvider = new MistralProvider(process.env.MISTRAL_API_KEY || "");

export default mistralProvider;
