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
const DEFAULT_TEXT_MODEL = "claude-3-5-sonnet-latest";
const DEFAULT_VISION_MODEL = "claude-3-5-sonnet-latest";

export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;

  constructor(
    apiKey: string,
    baseURL: string = "https://api.anthropic.com/v1"
  ) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async generateText(
    messages: Message[],
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse> {
    try {
      const model = options?.model || DEFAULT_TEXT_MODEL;

      const response = await fetch(`${this.baseURL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: options?.maxTokens ?? 4096,
          messages: messages.map((msg) => ({
            role: msg.role === "system" ? "user" : msg.role,
            content: msg.content,
          })),
          temperature: options?.temperature ?? 1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const text = result.content[0].text;

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
          provider: "anthropic",
        },
      };
    } catch (error) {
      log.error(`Error in Anthropic generateText: ${error}`);
      throw new Error("Failed to generate text with Anthropic");
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

        const response = await fetch(`${this.baseURL}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: options?.maxTokens ?? 4096,
            messages: currentMessages.map((msg) => ({
              role: msg.role === "system" ? "user" : msg.role,
              content: msg.content,
            })),
            temperature: options?.temperature ?? 1,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Anthropic API error: ${response.status} ${errorText}`
          );
        }

        const result = await response.json();
        const newText = result.content[0].text;
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
            `Anthropic LongText: ${countWords(output)}/${options.desiredWords} words, continuing...`
          );
          currentMessages.push({
            role: "user",
            content: `You reached ${countWords(output)} of ${options.desiredWords} desired words. Please continue in the same language as the text. Don't repeat yourself.`,
          });
        } else {
          log.debug(`Anthropic LongText: finished after ${retryCount} retries`);
          finished = true;
        }
      } catch (error) {
        log.error(`Anthropic LongText error: ${error}`);
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
        provider: "anthropic",
      },
    };
  }
}

// Create and register the Anthropic provider
const anthropicProvider = new AnthropicProvider(
  process.env.ANTHROPIC_API_KEY || ""
);

export default anthropicProvider;
