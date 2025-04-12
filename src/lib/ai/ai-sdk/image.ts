import { experimental_generateImage as generateImage } from "ai";
import type { UserContext } from "./types";
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

interface BFLResponse {
  id: string;
  status: string;
  result?: {
    sample: string;
  };
}

export const imageGenerationValidation = v.object({
  prompt: v.string(),
  width: v.number(),
  height: v.number(),
  n: v.number(),
  seed: v.number(),
});

/**
 * Generate images based on a prompt
 */
export async function generateImages(
  prompt: string,
  context: UserContext,
  options?: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  try {
    let providerAndModelName = "black-forest-labs:flux-pro-1.1";

    // HACK: Using Black Forest Labs API directly
    const response = await fetch("https://api.us1.bfl.ai/v1/flux-pro-1.1", {
      method: "POST",
      headers: {
        accept: "application/json",
        "x-key": process.env.BLACK_FOREST_LABS_API_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        width: options?.width ?? 1024,
        height: options?.height ?? 768,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const requestData = (await response.json()) as BFLResponse;
    const requestId = requestData.id;

    // Poll for the result
    let result: BFLResponse;
    while (true) {
      const resultResponse = await fetch(
        `https://api.us1.bfl.ai/v1/get_result?id=${requestId}`,
        {
          headers: {
            accept: "application/json",
            "x-key": process.env.BLACK_FOREST_LABS_API_KEY ?? "",
          },
        }
      );

      if (!resultResponse.ok) {
        throw new Error(
          `Result request failed with status ${resultResponse.status}`
        );
      }

      result = (await resultResponse.json()) as BFLResponse;
      if (result.status === "Ready") {
        break;
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!result.result?.sample) {
      throw new Error("No image URL returned from API");
    }

    // Download the image from the signed URL
    const imageResponse = await fetch(result.result.sample);
    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = `data:image/jpeg;base64,${Buffer.from(arrayBuffer).toString("base64")}`;

    // Log the image generation
    log.logToDB({
      level: "info",
      organisationId: context?.organisationId,
      sessionId: context?.userId,
      source: "ai",
      category: "image-generation",
      message: "image-generation-complete",
      metadata: {
        model: "black-forest-labs:flux-pro-1.1",
        imageCount: 1,
        width: options?.width ?? 1024,
        height: options?.height ?? 768,
      },
    });

    return {
      id: nanoid(6),
      images: [base64Image],
      model: "black-forest-labs:flux-pro-1.1",
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
