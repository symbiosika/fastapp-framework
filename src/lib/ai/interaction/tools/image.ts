import { nanoid } from "nanoid";
import { type Tool } from "ai";
import { jsonSchema } from "ai";
import { createReplicate } from "@ai-sdk/replicate";
import { experimental_generateImage as generateImage } from "ai";
import log from "../../../log";
import { saveFile } from "../../../storage";
import { addEntryToToolMemory } from "../tools";
import type { ToolReturn, ToolContext } from "../../../..";
import { getBaseUrl } from "./utils";

export type ReplicateTools = "createImage";

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
const replicate = createReplicate({
  apiToken: REPLICATE_API_KEY,
});

const replicateModels = [
  "black-forest-labs/flux-1.1-pro",
  "black-forest-labs/flux-1.1-pro-ultra",
  "black-forest-labs/flux-dev",
  "black-forest-labs/flux-pro",
  "black-forest-labs/flux-schnell",
  "bytedance/sdxl-lightning-4step",
  "fofr/aura-flow",
  "fofr/latent-consistency-model",
  "fofr/realvisxl-v3-multi-controlnet-lora",
  "fofr/sdxl-emoji",
  "fofr/sdxl-multi-controlnet-lora",
  "ideogram-ai/ideogram-v2",
  "ideogram-ai/ideogram-v2-turbo",
  "lucataco/dreamshaper-xl-turbo",
  "lucataco/open-dalle-v1.1",
  "lucataco/realvisxl-v2.0",
  "lucataco/realvisxl2-lcm",
  "luma/photon",
  "luma/photon-flash",
  "nvidia/sana",
  "playgroundai/playground-v2.5-1024px-aesthetic",
  "recraft-ai/recraft-v3",
  "recraft-ai/recraft-v3-svg",
  "stability-ai/stable-diffusion-3.5-large",
  "stability-ai/stable-diffusion-3.5-large-turbo",
  "stability-ai/stable-diffusion-3.5-medium",
  "tstramer/material-diffusion",
] as const;

/**
 * Creates an image generation tool with the provided context
 */
export const getImageGeneratorTool = (context: ToolContext): ToolReturn => {
  const toolName = `generate-image-${nanoid(10)}`;

  const imageTool: Tool = {
    description:
      "Generate images based on text prompts and return an download URL",
    parameters: jsonSchema({
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The text prompt to generate an image from",
        },
        width: {
          type: "number",
          description: "Width of the generated image",
          default: 1024,
        },
        height: {
          type: "number",
          description: "Height of the generated image",
          default: 1024,
        },
        seed: {
          type: "number",
          description: "Random seed for image generation",
        },
        n: {
          type: "number",
          description: "Number of images to generate",
          default: 1,
        },
      },
      required: ["prompt"],
    }),
    execute: async (params: any) => {
      log.info("TOOL-CALL: generating images", params);

      const { prompt, width = 1024, height = 1024, seed, n = 1 } = params;

      try {
        const result = await generateImage({
          model: replicate.image("black-forest-labs/flux-1.1-pro"),
          prompt,
        });

        // Create File object
        const file = new File(
          [result.images[0].uint8Array],
          "generated-image.jpg",
          {
            type: result.images[0].mimeType,
          }
        );

        const savedFileMeta = await saveFile(
          file,
          "default",
          context.organisationId,
          "db"
        );

        addEntryToToolMemory(context.chatId, {
          toolName,
          artifacts: [
            {
              type: "image",
              url: `${getBaseUrl()}${savedFileMeta.path}`,
            },
          ],
        });

        return JSON.stringify({
          url: `${getBaseUrl()}${savedFileMeta.path}`,
        });
      } catch (error: any) {
        log.error("Error generating images", error);
        return "Error generating images: " + error.message;
      }
    },
  };

  return {
    name: toolName,
    tool: imageTool,
  };
};
