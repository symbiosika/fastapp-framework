import OpenAIClient from "openai";
import fs from "fs/promises";
import log from "../../../lib/log";
import { basename } from "path";
import type { WhisperResponseWithSegmentsAndWords } from "../../../lib/types/openai";
import { nanoid } from "nanoid";

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
 * Generate an embedding for the given text using the OpenAI API.
 */
export async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    encoding_format: "float",
  });
  return {
    embedding: response.data[0].embedding,
    model: EMBEDDING_MODEL,
  };
}

/**
 * Generate a summary for the given text using the OpenAI API.
 */
export async function generateSummary(text: string) {
  const response = await openai.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a professional writer and you have been asked to write a short and relevant summary of the following text:`,
      },
      {
        role: "user",
        content: text,
      },
    ],
  });
  return response.choices[0].message.content;
}

/**
 * Encode the given image as a base64 string.
 */
async function encodeImageFromPath(imagePath: string): Promise<string> {
  const imageBuffer = await fs.readFile(imagePath);
  return Buffer.from(imageBuffer).toString("base64");
}

/**
 * Encode a File object as a base64 string.
 */
async function encodeImageFromFile(file: File): Promise<string> {
  const imageBuffer = await file.arrayBuffer();
  return Buffer.from(imageBuffer).toString("base64");
}

/**
 * Generate a description for the given image using the OpenAI API.
 */
export async function generateImageDescription(image: File) {
  const base64Image = await encodeImageFromFile(image);
  const response = await openai.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "What’s in this image?",
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
    max_tokens: 300,
  });

  return response.choices[0].message.content ?? "";
}

/**
 * Custom ChatCompletion function to generate a response for the given prompt.
 * Will respond with a JSON object always.
 */
export async function chatCompletionAsJson(
  messages: Message[]
): Promise<Message[]> {
  const completion = await openai.chat.completions.create({
    messages: messages as any,
    model: TEXT_MODEL,
    response_format: { type: "json_object" },
  });

  const response = completion.choices[0].message.content;
  const parsedResponse = JSON.parse(response ?? "");

  return parsedResponse;
}

/**
 * ChatCompletion function to generate a response for the given prompt.
 * Will respond with plain Text only.
 */
export async function chatCompletion(messages: Message[]): Promise<string> {
  const completion = await openai.chat.completions.create({
    messages: messages as any,
    model: TEXT_MODEL,
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
  outputType: "text" | "json" = "text",
  desiredWords?: number,
  maxRetries: number = 5
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
        model: TEXT_MODEL,
        max_tokens: 2000,
        response_format:
          outputType === "json" ? { type: "json_object" } : undefined,
      });

      const newText = completion.choices[0].message.content ?? "";
      output += newText;

      // Update messages to include the assistant's reply and a prompt to continue
      currentMessages.push({
        role: "assistant",
        content: newText,
      });

      // Add a user message to prompt continuation if needed
      if (desiredWords && countWords(output) < desiredWords) {
        log.debug(
          `ChatCompletionLongText: ${countWords(output)}/${desiredWords} words, continuing...`
        );
        currentMessages.push({
          role: "user",
          content: `You reached ${countWords(output)} of ${desiredWords} desired words. Please continue in the same language as the text. Don't repeat yourself.`,
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
      if (retryCount >= maxRetries) {
        throw new Error("Failed to generate text after maximum retries");
      }
    }
  }

  let parsedJson: any;
  if (outputType === "json") {
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
export const speechToText = async (query: {
  file?: File;
  filePath?: string;
  returnSegments?: boolean;
  returnWords?: boolean;
}) => {
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
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: createTimestampGranularities,
  });

  const r = transcription as unknown as WhisperResponseWithSegmentsAndWords;

  return r;
};

/**
 * Use OpenAI for Image Generation
 */
export const generateImage = async (prompt: string) => {
  const response = await openai.images.generate({
    model: IMAGE_GENERATION_MODEL,
    prompt,
    n: 1,
    size: "1024x1024",
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
 * Parse an image and return a detailed description of its content using the OpenAI API.
 */

const PARSE_IMAGE_PROMPT = `
You are an expert image analyst.
Provide a detailed description of the following image.`;

export async function parseImage(image: File): Promise<string> {
  const base64Image = await encodeImageFromFile(image);
  const response = await openai.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      {
        role: "system",
        content: PARSE_IMAGE_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe this image in detail:",
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
    max_tokens: 500,
  });

  return response.choices[0].message.content ?? "";
}

/**
 * Rewrites the given text in a neutral, descriptive manner suitable for product development.
 * The text will be returned in the same language as the input.
 */
const REWRITE_TEXT_PROMPT = `
You are a professional writer and ghost writer.
Rewrite the following text to be neutral, descriptive, and as concise as needed for product development purposes.
Maintain the same language as the input! This is important!`;

export async function rewriteText(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: "system",
        content: REWRITE_TEXT_PROMPT,
      },
      {
        role: "user",
        content: text,
      },
    ],
  });
  return response.choices[0].message.content ?? "";
}

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
