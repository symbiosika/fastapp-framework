import { nanoid } from "nanoid";
import { type Tool } from "ai";
import { jsonSchema } from "ai";
import log from "../../../log";
import type { ToolReturn, ToolContext } from "../../../..";
import { generateText } from "ai";
import { perplexity } from "@ai-sdk/perplexity";
import { addEntryToToolMemory } from "../tools";

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
        log.info("TOOL-CALL: fetching content from URL", url);

        // Generate content using Perplexity's sonar model
        const research = await generateText({
          model: perplexity("sonar-pro"),
          prompt: `You will return the content for this webpage: ${url}. Only return the content from this specific URL, do not include any additional information or research.`,
        });

        log.info("URL content fetched successfully");

        // Add the source to the tool memory
        addEntryToToolMemory(context.chatId, {
          toolName,
          sources: [
            {
              type: "url",
              label: url,
              url: url,
            },
          ],
        });

        // Return the formatted text directly
        return research.text;
      } catch (error: any) {
        log.error("Error fetching URL content", error);
        return "Error fetching URL content: " + error.message;
      } 
    },
  };

  return {
    name: toolName,
    tool: urlTool,
  };
};
