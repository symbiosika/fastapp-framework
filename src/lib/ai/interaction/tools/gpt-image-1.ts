import { nanoid } from "nanoid";
import { type Tool } from "ai";
import { jsonSchema } from "ai";
import { _GLOBAL_SERVER_CONFIG } from "../../../../store";
import log from "../../../log";
import { saveFile } from "../../../storage";
import { addEntryToToolMemory } from "../tools";
import type { ToolReturn, ToolContext } from "../../../..";
import { getBaseUrl } from "./utils";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Creates an image generation tool with the provided context
 */
export const getGptImage1Tool = (context: ToolContext): ToolReturn => {
  const toolName = `generate-image-${nanoid(10)}`;

  const imageTool: Tool = {
    description:
      "Generate images based on text prompts using OpenAI's gpt-image-1 model",
    parameters: jsonSchema({
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The text prompt to generate an image from",
        },
        background: {
          type: "string",
          description: "Background type: transparent, opaque, or auto",
          enum: ["transparent", "opaque", "auto"],
          default: "auto",
        },
        n: {
          type: "number",
          description: "Number of images to generate (1-10)",
          default: 1,
          minimum: 1,
          maximum: 10,
        },
        output_compression: {
          type: "number",
          description: "Compression level (0-100%)",
          default: 100,
          minimum: 0,
          maximum: 100,
        },
        output_format: {
          type: "string",
          description: "Output format",
          enum: ["png", "jpeg", "webp"],
          default: "png",
        },
        quality: {
          type: "string",
          description: "Image quality",
          enum: ["high", "medium", "low", "auto"],
          default: "auto",
        },
        size: {
          type: "string",
          description: "Image size",
          enum: ["1024x1024", "1536x1024", "1024x1536", "auto"],
          default: "auto",
        },
      },
      required: ["prompt"],
    }),
    execute: async (params: any) => {
      log.info("TOOL-CALL: generating images with OpenAI", params);

      const {
        prompt,
        background = "auto",
        n = 1,
        output_compression = 100,
        output_format = "png",
        quality = "auto",
        size = "auto",
      } = params;

      const body = {
        model: "gpt-image-1",
        prompt,
        background,
        n,
        output_compression,
        output_format,
        quality,
        size,
      };

      try {
        const response = await fetch(
          "https://api.openai.com/v1/images/generations",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify(body),
          }
        );

        if (!response.ok) {
          log.error("OpenAI API error", response);
          return "OpenAI API error: " + response.statusText;
        }

        const data = await response.json();

        if (!data.data?.[0]?.b64_json) {
          log.error("No image data received from OpenAI", data);
          return "No image data received from OpenAI";
        }

        // Convert base64 to Uint8Array
        const base64Data = data.data[0].b64_json;
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create File object
        const file = new File([bytes], `generated-image.${output_format}`, {
          type: `image/${output_format}`,
        });

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
        return "Error generating images: " + error.message;
      }
    },
  };

  return {
    name: toolName,
    tool: imageTool,
  };
};
