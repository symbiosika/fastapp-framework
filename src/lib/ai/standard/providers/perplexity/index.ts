import log from "../../../../log";
import type {
  AIProvider,
  TextGenerationOptions,
  TextGenerationResponse,
  LongTextGenerationOptions,
  LongTextGenerationResponse,
  Message,
} from "../../types";
import { MAXIMUM_EXTERNAL_CALL_TIMEOUT } from "../../standards";
import { countWords, extractThinkingsAndContent } from "../../utils";

// Default models
const DEFAULT_TEXT_MODEL = "sonar";
const DEFAULT_VISION_MODEL = "sonar";

export class PerplexityProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL: string = "https://api.perplexity.ai") {
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
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Perplexity API error: ${response.status} ${errorText}`
        );
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
          provider: "perplexity",
        },
      };
    } catch (error) {
      log.error(`Error in Perplexity generateText: ${error}`);
      throw new Error("Failed to generate text with Perplexity");
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
    const thinkings: string[] = [];
    const citations: string[] = [];

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
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Perplexity API error: ${response.status} ${errorText}`
          );
        }

        const result = await response.json();
        // log.debug(result);
        /*
        Optional:
        result.choices[0].message.content = `<think>...</think>...`

        result.usage.prompt_tokens
        result.usage.completion_tokens
        result.usage.total_tokens
        result.usage.citation_tokens
        result.usage.num_search_queries
        result.usage.reasoning_tokens
        result.choices[0].finish_reason === "stop", if result was OK

        result.citations = string[]        
        */
        const content: string = result.choices[0].message.content;

        const extraced = extractThinkingsAndContent(content);
        thinkings.push(...extraced.thinkings);

        output += extraced.content;

        // check if the response has some citations
        if (result.citations && Array.isArray(result.citations)) {
          citations.push(...result.citations);
        }

        // Update messages to include the assistant's reply
        currentMessages.push({
          role: "assistant",
          content: extraced.content,
        });

        // Add a user message to prompt continuation if needed
        if (
          options?.desiredWords &&
          countWords(output) < options.desiredWords
        ) {
          log.debug(
            `Perplexity LongText: ${countWords(output)}/${options.desiredWords} words, continuing...`
          );
          currentMessages.push({
            role: "user",
            content: `You reached ${countWords(output)} of ${options.desiredWords} desired words. Please continue in the same language as the text. Don't repeat yourself.`,
          });
        } else {
          log.debug(
            `Perplexity LongText: finished after ${retryCount} retries`
          );
          finished = true;
        }
      } catch (error) {
        log.error(`Perplexity LongText error: ${error}`);
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
        output = output.replace(/```json/g, "").replace(/```/g, "");
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
        provider: "perplexity",
        thinkings,
        citations,
      },
    };
  }
}

// Create and register the Perplexity provider
const perplexityProvider = new PerplexityProvider(
  process.env.PERPLEXITY_API_KEY || ""
);

export default perplexityProvider;
