import { nanoid } from "nanoid";
import { type Tool } from "ai";
import { jsonSchema } from "ai";
import { getMarkdownFromUrl } from "../../parsing/url";
import log from "../../../log";
import type { ToolReturn, ToolContext } from "../../../..";

export type UrlTools = "parseUrl";

/**
 * Creates a URL parsing tool with the provided context
 */
export const getUrlParserTool = (context: ToolContext): ToolReturn => {
  const toolName = `parse-url-${nanoid(10)}`;

  const urlTool: Tool = {
    description:
      "Can parse a URL and return its content as markdown. Can be used when full URLs are given in the prompt.",
    parameters: jsonSchema({
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to parse",
        },
      },
      required: ["url"],
    }),
    execute: async (params: any) => {
      log.info("TOOL-CALL: parsing URL", params);

      const { url } = params;

      try {
        const markdown = await getMarkdownFromUrl(url);
        return JSON.stringify({
          markdown,
        });
      } catch (error: any) {
        throw new Error(`Error parsing URL: ${error.message}`);
      }
    },
  };

  return {
    name: toolName,
    tool: urlTool,
  };
};
