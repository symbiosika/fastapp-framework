import OpenAIClient from "openai";
import fs from "fs/promises";
import log from "../../log";
import { basename } from "path";
import type { WhisperResponseWithSegmentsAndWords } from "../../types/openai";
import { nanoid } from "nanoid";

/*
This library is a wrapper for LLM APIs.
At the moment it only supports OpenAI.
All functions should be designed to support different providers in the future!
*/

/**
 * Define the standards
 */
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const VISION_MODEL = "gpt-4-turbo";
export const TEXT_MODEL = "gpt-4-turbo";
export const FAST_TEXT_MODEL = "gpt-3.5-turbo";
export const TTS_MODEL = "tts-1";
export const STT_MODEL = "whisper-1";
export const IMAGE_GENERATION_MODEL = "dall-e-3";

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

export const openai = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an embedding for the given text
 */
export async function generateEmbedding(
  text: string,
  embeddingModel: string = EMBEDDING_MODEL
) {
  const response = await openai.embeddings.create({
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
  model: string = TEXT_MODEL
) {
  const base64Image = await encodeImageFromFile(image);
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "What’s in this image? Explain it in detail with as many details as possible.",
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
}

/**
 * Custom ChatCompletion function to generate a response for the given prompt.
 * Will respond with a JSON object always.
 */
export async function chatCompletionAsJson(
  messages: Message[],
  model: string = TEXT_MODEL
): Promise<Message[]> {
  const completion = await openai.chat.completions.create({
    messages: messages as any,
    model,
    response_format: { type: "json_object" },
  });

  const response = completion.choices[0].message.content;
  try {
    const parsedResponse = JSON.parse(response ?? "");
    return parsedResponse;
  } catch (error) {
    log.error(`Error parsing JSON: ${error}. Response: ${response}`);
    throw new Error(
      `Result could not be parsed as JSON. Please check the Logs.`
    );
  }
}

/**
 * ChatCompletion function to generate a response for the given prompt.
 * Will respond with plain Text only.
 */
export async function chatCompletion(
  messages: Message[],
  model = TEXT_MODEL
): Promise<string> {
  const completion = await openai.chat.completions.create({
    messages: messages as any,
    model,
  });

  const response = completion.choices[0].message.content ?? "";
  return response;
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
  }
): Promise<{
  text: string;
  json?: any;
}> {
  let output = "";
  let currentMessages = [...messages];
  let retryCount = 0;
  let finished = false;

  while (!finished) {
    try {
      const completion = await openai.chat.completions.create({
        messages: currentMessages as any,
        model: options?.model ?? TEXT_MODEL,
        max_tokens: options?.maxTokens ?? undefined,
        response_format:
          options?.outputType === "json" ? { type: "json_object" } : undefined,
      });

      const newText = completion.choices[0].message.content ?? "";
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
      log.debug(`Error in chatCompletionLongText: ${error}`);
      retryCount++;
      if (options?.maxRetries && retryCount >= options.maxRetries) {
        throw new Error("Failed to generate text after maximum retries");
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

  const transcription = await openai.audio.transcriptions.create({
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
  const response = await openai.images.generate({
    model,
    prompt: `${prompt} ${negativePrompt ? `. It contains not ${negativePrompt}` : ""}`,
    n: 1,
    size: `${width}x${height}` as any,
  });
  const image_url = response.data[0].url;
  if (!image_url) {
    throw new Error("No image URL returned");
  }
  // console.log('Image URL:', image_url);
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
  const mp3 = await openai.audio.speech.create({
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
