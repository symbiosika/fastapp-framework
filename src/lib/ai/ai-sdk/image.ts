import { experimental_generateImage as generateImage } from "ai";
import { createReplicate } from "@ai-sdk/replicate";
import type { OrganisationContext } from "./types";
import log from "../../log";
import { nanoid } from "nanoid";
import * as v from "valibot";

/*
https://sdk.vercel.ai/docs/ai-sdk-core/image-generation
*/

interface ImageGenerationOptions {
  providerAndModelName?: string;
  width?: number;
  height?: number;
  n?: number;
  seed?: number;
}

interface ImageGenerationResult {
  id: string;
  images: string[]; // Array of base64 encoded images
  model: string;
  meta: {
    imageCount: number;
    width: number;
    height: number;
  };
}

export const imageGenerationValidation = v.object({
  prompt: v.string(),
  width: v.number(),
  height: v.number(),
  n: v.number(),
  seed: v.number(),
});

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
const replicate = createReplicate({
  apiToken: REPLICATE_API_KEY,
});

/**
 * Generate images based on a prompt
 */
export async function generateImages(
  prompt: string,
  context: OrganisationContext,
  options?: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  try {
    const model = "black-forest-labs/flux-1.1-pro";

    const result = await generateImage({
      model: replicate.image(model),
      prompt,
      size: `${options?.width ?? 1024}x${options?.height ?? 768}`,
    });

    // Convert the generated image to base64
    const base64Image = `data:${result.images[0].mimeType};base64,${Buffer.from(result.images[0].uint8Array).toString("base64")}`;

    // Log the image generation
    log.logToDB({
      level: "info",
      organisationId: context?.organisationId,
      sessionId: context?.userId,
      source: "ai",
      category: "image-generation",
      message: "image-generation-complete",
      metadata: {
        model,
        imageCount: 1,
        width: options?.width ?? 1024,
        height: options?.height ?? 768,
      },
    });

    return {
      id: nanoid(6),
      images: [base64Image],
      model,
      meta: {
        imageCount: 1,
        width: options?.width ?? 1024,
        height: options?.height ?? 768,
      },
    };
  } catch (error) {
    log.error(`Error in generateImages: ${error}`);
    throw new Error("Failed to generate images");
  }
}
