import { nanoid } from "nanoid";
import { type Tool } from "ai";
import { jsonSchema } from "ai";
import log from "../../../log";
import { saveFile } from "../../../storage";
import { addEntryToToolMemory, getShortTermMemory } from "../tools";
import type { ToolReturn, ToolContext } from "../../../..";
import { getBaseUrl } from "./utils";
import { createReplicate } from "@ai-sdk/replicate";
import { experimental_generateImage as generateImage } from "ai";
import path from "path";

export type ReplicateTools = "createImage";

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
const replicate = createReplicate({
  apiToken: REPLICATE_API_KEY,
});

/**
 * Creates an image generation tool with the provided context using FLUX.1 Kontext Pro
 * This model supports both text-to-image and image-to-image generation with context awareness
 */
export const getImageGeneratorToolFluxKontext = (
  context: ToolContext
): ToolReturn => {
  const toolName = `generate-image-flux-kontext-${nanoid(10)}`;

  const imageTool: Tool = {
    description:
      "Generate or edit images based on text prompts using FLUX.1 Kontext Pro. Can create new images from text or edit existing images from context with text instructions. Supports context-aware editing and maintains character consistency.",
    parameters: jsonSchema({
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description:
            "The text prompt to generate or edit an image. Be specific and detailed for best results.",
        },
        useInputImage: {
          type: "boolean",
          description:
            "Whether to use an input image from the conversation context for editing. If true, will edit the most recent image from the conversation.",
          default: false,
        },
        width: {
          type: "number",
          description:
            "Width of the generated image (32-1440, must be multiple of 32)",
          default: 1024,
          minimum: 32,
          maximum: 1440,
        },
        height: {
          type: "number",
          description:
            "Height of the generated image (32-1440, must be multiple of 32)",
          default: 1024,
          minimum: 32,
          maximum: 1440,
        },
        seed: {
          type: "number",
          description: "Random seed for reproducible generation",
        },
        safety_tolerance: {
          type: "number",
          description:
            "Safety tolerance level (1-5, higher is more permissive)",
          default: 2,
          minimum: 1,
          maximum: 5,
        },
      },
      required: ["prompt"],
    }),
    execute: async (params: any) => {
      log.info(
        "TOOL-CALL: generating/editing images with FLUX.1 Kontext Pro",
        params
      );

      const {
        prompt,
        useInputImage = false,
        width = 1024,
        height = 1024,
        seed,
        safety_tolerance = 2,
      } = params;

      try {
        // Get input images from short term memory if useInputImage is true
        const shortTermMemory = getShortTermMemory(context.chatId);
        const inputArtifacts = shortTermMemory.inputArtifacts || [];
        const hasInputImages = inputArtifacts.length > 0 && useInputImage;

        let inputImage = null;
        if (hasInputImages) {
          // Find the most recent image artifact
          const imageArtifact = inputArtifacts
            .filter((artifact) => artifact.type === "image")
            .slice(-1)[0]; // Get the most recent image

          if (imageArtifact && imageArtifact.file) {
            // Convert the File to a data URL for the API
            const arrayBuffer = await imageArtifact.file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            inputImage = `data:${imageArtifact.file.type};base64,${base64}`;
          }
        }

        log.info("FLUX Kontext Pro input parameters:", prompt);

        const result = await generateImage({
          model: replicate.image("black-forest-labs/flux-kontext-pro"),
          prompt,
          size: `${width}x${height}`,
          providerOptions: {
            replicate: {
              input_image: inputImage,
            },
          },
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

        const resultMessage = hasInputImages
          ? `Image successfully edited with FLUX.1 Kontext Pro based on prompt: "${prompt}"`
          : `Image successfully generated with FLUX.1 Kontext Pro based on prompt: "${prompt}"`;

        return JSON.stringify({
          success: true,
          url: `${getBaseUrl()}${savedFileMeta.path}`,
          message: resultMessage,
          usedInputImage: hasInputImages,
        });
      } catch (error: any) {
        log.error("Error with FLUX.1 Kontext Pro", error);
        return (
          "Error generating/editing image with FLUX.1 Kontext Pro: " +
          error.message
        );
      }
    },
  };

  return {
    name: toolName,
    tool: imageTool,
  };
};
