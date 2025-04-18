import { type Tool } from "ai";
import { generateText, jsonSchema } from "ai";
import { perplexity } from "@ai-sdk/perplexity";
import { nanoid } from "nanoid";
import log from "../../../log";
import { addEntryToToolMemory } from "../tools";
import type { ToolContext, ToolReturn } from "../../../..";

/**
 * Creates a general purpose web research tool
 * that can be adjusted to the needs of the user
 */
const getADefinedWebResearchTool = (
  context: ToolContext,
  options: {
    description: string;
    model: "sonar" | "sonar-pro" | "sonar-deep-research";
    systemPrompt?: string;
    maxTokens: number;
  }
): ToolReturn => {
  const toolName = `web-research-${nanoid(10)}`;

  const webResearchTool: Tool = {
    description: options.description,
    parameters: jsonSchema({
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The main topic the research",
        },
      },
      required: ["topic"],
    }),
    execute: async (params) => {
      log.info("call tool webResearchTool", params);

      // Destructure the parameters with sensible defaults
      const { topic = "" } = params;

      try {
        log.info("TOOL-CALL: researching web for topic", topic);

        // Generate research using Perplexity's sonar model
        const research = await generateText({
          model: perplexity(options.model),
          system: options.systemPrompt
            ? `${options.systemPrompt}\nIMPORTANT: Always respond in the same language as the input text.`
            : `IMPORTANT: Always respond in the same language as the input text.`,
          prompt: topic,
          maxTokens: options.maxTokens,
        });

        log.info("web research completed");

        // Add all web sources to the tool memory
        addEntryToToolMemory(context.chatId, {
          toolName,
          sources: research.sources.map((source) => ({
            type: "url",
            label: source.url,
            url: source.url,
          })),
        });

        // Return the formatted text directly
        return research.text;
      } catch (error: any) {
        throw new Error(`Error researching web: ${error.message}`);
      }
    },
  };

  return {
    name: toolName,
    tool: webResearchTool,
  };
};

export const getWebResearchTool = (context: ToolContext): ToolReturn => {
  return getADefinedWebResearchTool(context, {
    description:
      "Search the web for information. Can be used to get actual information or to get ideas for a blog post.",
    model: "sonar",
    maxTokens: 16000,
  });
};
