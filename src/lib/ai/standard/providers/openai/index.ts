import OpenAIClient from "openai";
import fs from "fs/promises";
import log from "../../../../log";
import { basename } from "path";
import { nanoid } from "nanoid";
import type {
  AIProvider,
  TextGenerationOptions,
  TextGenerationResponse,
  LongTextGenerationOptions,
  LongTextGenerationResponse,
  EmbeddingOptions,
  EmbeddingResponse,
  ImageGenerationOptions,
  ImageGenerationResponse,
  SpeechToTextOptions,
  SpeechToTextResponse,
  TextToSpeechOptions,
  TextToSpeechResponse,
} from "../../types";
import { EMBEDDING_MODEL } from "../../index";
import type { Message } from "../../types";
import type { WhisperResponseWithSegmentsAndWords } from "../../../../types/openai";
import { countWords } from "../../utils";
import { MAXIMUM_EXTERNAL_CALL_TIMEOUT } from "../../standards";

// Default models
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_VISION_MODEL = "gpt-4o-mini";
const DEFAULT_TEXT_MODEL = "gpt-4o-mini";
const DEFAULT_FAST_TEXT_MODEL = "gpt-4o-mini";
const DEFAULT_TTS_MODEL = "tts-1";
const DEFAULT_STT_MODEL = "whisper-1";
const DEFAULT_IMAGE_GENERATION_MODEL = "dall-e-3";

export class OpenAIProvider implements AIProvider {
  private client: OpenAIClient;

  constructor(apiKey: string, baseURL: string = "https://api.openai.com/v1") {
    this.client = new OpenAIClient({
      baseURL,
      apiKey,
    });
  }

  async generateText(
    messages: Message[],
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || DEFAULT_TEXT_MODEL,
        temperature: options?.temperature ?? 1,
        messages: messages as any,
        max_tokens: options?.maxTokens,
        response_format:
          options?.outputType === "json"
            ? { type: "json_object" }
            : { type: "text" },
      });

      const text = response.choices[0].message.content ?? "";

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
          model: options?.model || DEFAULT_TEXT_MODEL,
          provider: "openai",
        },
      };
    } catch (error) {
      log.error(`Error in OpenAI generateText: ${error}`);
      throw new Error("Failed to generate text with OpenAI");
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

        const response = await this.client.chat.completions.create(
          {
            model,
            temperature: options?.temperature ?? 1,
            messages: currentMessages as any,
            max_tokens: options?.maxTokens,
          },
          { signal: controller.signal as any }
        );

        clearTimeout(timeoutId);

        const newText = response.choices[0].message.content ?? "";
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
            `OpenAI LongText: ${countWords(output)}/${options.desiredWords} words, continuing...`
          );
          currentMessages.push({
            role: "user",
            content: `You reached ${countWords(output)} of ${options.desiredWords} desired words. Please continue in the same language as the text. Don't repeat yourself.`,
          });
        } else {
          log.debug(`OpenAI LongText: finished after ${retryCount} retries`);
          finished = true;
        }
      } catch (error) {
        log.error(`OpenAI LongText error: ${error}`);
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
        provider: "openai",
      },
    };
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
      provider: "openai",
    };
  }

  async generateImage(
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResponse> {
    const model = options?.model || DEFAULT_IMAGE_GENERATION_MODEL;
    const negativePrompt = options?.negativePrompt || "";
    const width = options?.width || 1024;
    const height = options?.height || 1024;

    const response = await this.client.images.generate({
      model,
      prompt: `${prompt} ${negativePrompt ? `. It contains not ${negativePrompt}` : ""}`,
      n: 1,
      size: `${width}x${height}` as any,
    });

    const image_url = response.data[0].url;
    if (!image_url) {
      throw new Error("No image URL returned");
    }

    const imageBuffer = await (await fetch(image_url)).arrayBuffer();

    return {
      imageBuffer,
      meta: {
        model,
        provider: "openai",
      },
    };
  }

  async speechToText(
    audioData: File | string,
    options?: SpeechToTextOptions
  ): Promise<SpeechToTextResponse> {
    const model = options?.model || DEFAULT_STT_MODEL;
    let fileToUpload: File;

    if (audioData instanceof File) {
      fileToUpload = audioData;
    } else {
      const fileBuffer = await fs.readFile(audioData);
      const fileName = basename(audioData);
      fileToUpload = new File([fileBuffer], fileName);
    }

    const createTimestampGranularities: ("segment" | "word")[] = [];
    if (options?.returnSegments) {
      createTimestampGranularities.push("segment");
    }
    if (options?.returnWords) {
      createTimestampGranularities.push("word");
    }

    const transcription = await this.client.audio.transcriptions.create({
      file: fileToUpload,
      model,
      response_format: "verbose_json",
      timestamp_granularities: createTimestampGranularities,
    });

    const result =
      transcription as unknown as WhisperResponseWithSegmentsAndWords;

    return {
      text: result.text,
      segments: result.segments,
      words: result.words,
      meta: {
        model,
        provider: "openai",
      },
    };
  }

  async textToSpeech(
    text: string,
    options?: TextToSpeechOptions
  ): Promise<TextToSpeechResponse> {
    const model = options?.model || DEFAULT_TTS_MODEL;
    const voice = options?.voice || "alloy";

    const mp3 = await this.client.audio.speech.create({
      model,
      voice: voice as any,
      input: text,
    });

    const buffer = await mp3.arrayBuffer();
    const id = nanoid(16);
    const filename = `${id}.mp3`;

    const file = new File([buffer], filename, { type: "audio/mp3" });

    return {
      file,
      filename,
      meta: {
        model,
        provider: "openai",
      },
    };
  }
}

// Create and register the OpenAI provider
const openaiProvider = new OpenAIProvider(process.env.OPENAI_API_KEY || "");

export default openaiProvider;
