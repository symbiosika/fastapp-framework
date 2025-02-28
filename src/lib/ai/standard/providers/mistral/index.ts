import log from "../../../../log";
import {
  type AIProvider,
  type TextGenerationOptions,
  type TextGenerationResponse,
  type LongTextGenerationOptions,
  type LongTextGenerationResponse,
  MAXIMUM_EXTERNAL_CALL_TIMEOUT,
} from "../";
import type { Message } from "../../index";
import { countWords } from "../../utils";

// Default models
const DEFAULT_TEXT_MODEL = "mistral-large-latest";
const DEFAULT_VISION_MODEL = "pixtral-large-latest";

export class MistralProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL: string = "https://api.mistral.ai/v1") {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async generateText(
    messages: Message[],
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse> {
    try {
      const model = options?.model || DEFAULT_TEXT_MODEL;

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: options?.temperature ?? 1,
          messages,
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
    let currentMessages = [...messages];
    let retryCount = 0;
    let finished = false;
    const model = options?.model || DEFAULT_TEXT_MODEL;

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

        const result = await response.json();
        const newText = result.choices[0].message.content;
        output += newText;

        // Update messages to include the assistant's reply
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
      },
    };
  }
}

// Create and register the Mistral provider
const mistralProvider = new MistralProvider(process.env.MISTRAL_API_KEY || "");

export default mistralProvider;
