import OpenAIClient from "openai";
import fs from "fs/promises";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const VISION_MODEL = "gpt-4-turbo";
export const TEXT_MODEL = "gpt-4-turbo";
export const FAST_TEXT_MODEL = "gpt-3.5-turbo";

interface MessageContent {
  type: string;
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface Message {
  role: "system" | "user";
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
async function encodeImage(imagePath: string): Promise<string> {
  const imageBuffer = await fs.readFile(imagePath);
  return Buffer.from(imageBuffer).toString("base64");
}

/**
 * Generate a description for the given image using the OpenAI API.
 */
export async function generateDescription(imagePath: string) {
  const base64Image = await encodeImage(imagePath);
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
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

  return response.choices[0].message.content;
}

/**
 * Custom ChatCompletion function to generate a response for the given prompt.
 * Will respond with a JSON object always.
 */
export async function chatCompletion(messages: Message[]): Promise<Message[]> {
  const completion = await openai.chat.completions.create({
    messages: messages as any,
    model: "gpt-4-turbo",
    response_format: { type: "json_object" },
  });

  const response = completion.choices[0].message.content;
  const parsedResponse = JSON.parse(response ?? "");

  return parsedResponse;
}

/**
 * Custom ChatCompletion function to generate a response for the given prompt.
 * Will respond with plain Text only.
 */
export async function chatCompletionText(messages: Message[]): Promise<string> {
  const completion = await openai.chat.completions.create({
    messages: messages as any,
    model: "gpt-4-turbo",
  });

  const response = completion.choices[0].message.content ?? "";
  return response;
}

/**
 * Use OpenAI for STT
 */
export const speechToText = async (audio: Blob) => {
  // convert blob to a file that can be uploaded to openai
  const file = new File([audio], "audio.mp3", { type: "audio/mp3" });
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });
  return transcription.text;
};

/**
 * Use OpenAI for Image Generation
 */
export const generateImage = async (prompt: string) => {
  const response = await openai.images.generate({
    model: "dall-e-3",
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
export async function parseImage(imagePath: string): Promise<string> {
  const base64Image = await encodeImage(imagePath);
  const response = await openai.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      {
        role: "system",
        content: `You are an expert image analyst. Provide a detailed description of the following image:`,
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
export async function rewriteText(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a requirement engineer. Rewrite the following text to be neutral, descriptive, and as concise as needed for product development purposes. Maintain the same language as the input! This is important!`,
      },
      {
        role: "user",
        content: text,
      },
    ],
  });
  return response.choices[0].message.content ?? "";
}
