import { type CoreMessage, embed, generateText, streamText } from "ai";
import type { OrganisationContext } from "./types";
import { getAIEmbeddingModel, getAIModel } from "./get-model";
import { encodeImageFromFile, removeMarkdownImageUrls } from "./utils";
import log from "../../log";
import type { LanguageModelV1 } from "ai";
import { nanoid } from "nanoid";
import { getToolMemory, getRuntimeToolsDictionary } from "../interaction/tools";
import type { SourceReturn, ArtifactReturn } from "./types";
import {
  updateLiveChat,
  clearLiveChat,
  clearAndStartNewSession,
} from "../chat-store/live-chat-cache";

/*
// Typen für die AI-Response basierend auf der Vercel AI SDK-Dokumentation
interface TextPart {
  type: "text";
  text: string;
}

interface ToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

interface ToolResultPart {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  result: unknown;
  isError?: boolean;
}

// Wir definieren hier unsere eigenen Nachrichtentypen, da wir die genauen SDK-Typen nicht haben
interface AssistantMessage {
  role: "assistant";
  content: string | Array<TextPart | ToolCallPart>;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface ToolMessage {
  role: "tool";
  tool_call_id: string;
  content: string;
}

type AiMessage = AssistantMessage | ToolMessage;

interface CompletionTokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

interface AIResponseWithTools {
  text: string;
  toolCalls?: {
    args: Record<string, unknown>;
    toolCallId: string;
    toolName: string;
    type: string;
  }[];
  toolResults?: {
    args: Record<string, unknown>;
    result: unknown;
    toolCallId: string;
    toolName: string;
    type: string;
  }[];
  usage?: CompletionTokenUsage;
  finishReason?: string;
}

// First, define your custom messages to exactly match CoreMessage format
interface CoreCompatibleAssistantMessage {
  role: "assistant";
  content:
    | string
    | {
        type: "text" | "image" | "tool_call";
        text?: string;
        image_url?: string;
        tool_call?: {
          id: string;
          type: "function";
          function: {
            name: string;
            arguments: string;
          };
        };
      }[];
}

interface CoreCompatibleToolMessage {
  role: "tool";
  content: string;
  tool_call_id: string;
}

interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
  toolCallId: string;
}

interface ToolResult {
  toolName: string;
  result: unknown;
  toolCallId: string;
}

interface Step {
  text: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  sources?: {
    sourceType: "url";
    id: string;
    url: string;
  }[];
}
*/

/**
 * Generate an embedding for the given text using AI SDK
 */
export async function generateEmbedding(
  text: string,
  context: OrganisationContext,
  providerAndModelName?: string
): Promise<{ embedding: number[]; model: string }> {
  if (!text || text.trim() === "") {
    throw new Error("Text is required");
  }

  if (!providerAndModelName) {
    providerAndModelName =
      process.env.DEFAULT_EMBEDDING_MODEL ?? "openai:text-embedding-3-small";
  }

  const model = await getAIEmbeddingModel(providerAndModelName, context);
  const { embedding } = await embed({
    model,
    value: text,
  });

  log.logToDB({
    level: "info",
    organisationId: context?.organisationId,
    sessionId: context?.userId,
    source: "ai",
    category: "embedding",
    message: "generate-embedding-complete",
    metadata: {
      model: providerAndModelName,
      embeddingLength: embedding.length,
    },
  });

  return {
    embedding,
    model: providerAndModelName,
  };
}

/**
 * Generate a description for the given image using AI SDK
 */
export async function generateImageDescription(
  image: File,
  context: OrganisationContext,
  providerAndModelName?: string
) {
  try {
    if (!providerAndModelName) {
      providerAndModelName =
        process.env.DEFAULT_IMAGE_DESCRIPTION_MODEL ?? "openai:gpt-4o-mini";
    }

    const model = await getAIModel(providerAndModelName, context);
    const base64Image = await encodeImageFromFile(image);
    const contentType = image.type || "image/jpeg";

    const result = await generateText({
      model: model as LanguageModelV1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What's in this image? Explain it in detail with as many details as possible.",
            },
            {
              type: "image",
              image: `data:${contentType};base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    log.logToDB({
      level: "info",
      organisationId: context?.organisationId,
      sessionId: context?.userId,
      source: "ai",
      category: "image-description",
      message: "generate-image-description-complete",
      metadata: {
        model: providerAndModelName,
        descriptionLength: result.text.length,
      },
    });

    return {
      text: result.text,
      model: providerAndModelName,
    };
  } catch (error) {
    log.error(`Error in generateImageDescription: ${error}`);
    throw new Error("Failed to generate image description");
  }
}

/**
 * ChatCompletion function to generate a response for the given prompt.
 * Uses streaming to update the live chat cache with partial responses.
 */
export async function chatCompletion(
  messages: CoreMessage[],
  context: OrganisationContext,
  options?: {
    providerAndModelName?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: string[];
  }
) {
  // Clear any existing live chat data for this chat
  clearAndStartNewSession(context.chatId);

  let providerAndModelName = options?.providerAndModelName;
  if (!providerAndModelName) {
    providerAndModelName =
      process.env.DEFAULT_CHAT_COMPLETION_MODEL ?? "openai:gpt-4o-mini";
  }

  const model = await getAIModel(providerAndModelName, context);
  const tools = getRuntimeToolsDictionary(context.chatId);

  let accumulatedText = "";
  let accumulatedSources: SourceReturn[] = [];
  let accumulatedArtifacts: ArtifactReturn[] = [];
  let usedTools: string[] = [];
  let allSteps: any[] = [];

  log.debug("Starting chat completion stream", {
    category: "ai",
    chatId: context.chatId,
  });

  const { textStream, sources } = await streamText({
    model: model as LanguageModelV1,
    messages,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
    tools,
    toolChoice: tools && Object.keys(tools).length > 0 ? "auto" : "none",
    maxSteps: 5,
    onStepFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
      // Store step information for final logs
      allSteps.push({
        text,
        toolCalls,
        toolResults,
        finishReason,
        usage,
      });

      if (context.chatId) {
        // Collect tools used in this step
        if (toolCalls) {
          toolCalls.forEach((call) => {
            if (!usedTools.includes(call.toolName)) {
              usedTools.push(call.toolName);
            }
          });
        }

        // Update live chat cache with current state
        updateLiveChat(context.chatId, {
          text: accumulatedText,
          complete: finishReason === "stop",
          meta: {
            toolsUsed: usedTools,
            sources: accumulatedSources,
            artifacts: accumulatedArtifacts,
          },
        });
      }

      // Existing logging
      log.logToDB({
        level: "debug",
        organisationId: context?.organisationId,
        sessionId: context?.userId,
        source: "ai",
        category: "text-generation",
        message: "text-generation-step-complete",
        metadata: {
          model: providerAndModelName,
          stepText: text,
          toolCalls: toolCalls?.map((call) => call.toolName),
          finishReason,
          usage,
        },
      });
    },
  });

  // Process the text stream in chunks
  for await (const textPart of textStream) {
    // Update the accumulated text
    accumulatedText += textPart;

    // Update live chat with the latest text
    if (context.chatId) {
      updateLiveChat(context.chatId, {
        text: accumulatedText,
        complete: false,
        meta: {
          toolsUsed: usedTools,
          sources: accumulatedSources,
          artifacts: accumulatedArtifacts,
        },
      });
    }
  }

  const usedSources = await sources;
  usedSources.forEach((source) => {
    accumulatedSources.push({
      type: "url",
      url: source.url,
      label: source.url,
    });
  });

  // Process tools and retrieve their data
  // Get all used tools from tool memory
  const toolMemory = getToolMemory(context.chatId);
  // Iterate over all tools in memory that has been used and add possible sources and artifacts to the response
  for (const tool in toolMemory) {
    toolMemory[tool].usedSources?.forEach((source) => {
      accumulatedSources.push(source);
    });
    toolMemory[tool].usedArtifacts?.forEach((artifact) => {
      accumulatedArtifacts.push(artifact);
    });
  }

  // Filter all duplicate sources (by label)
  accumulatedSources = accumulatedSources.filter(
    (source, index, self) =>
      index === self.findIndex((t) => t.label === source.label)
  );

  // Get the last step's usage for final stats
  const lastStep = allSteps[allSteps.length - 1];
  const usage = lastStep?.usage;

  // Update the live chat one last time with complete status
  if (context.chatId) {
    updateLiveChat(context.chatId, {
      text: accumulatedText,
      complete: true,
      meta: {
        toolsUsed: usedTools,
        sources: accumulatedSources,
        artifacts: accumulatedArtifacts,
      },
    });

    // Then clear after a moment (or you might want to keep it for a while)
    setTimeout(() => clearLiveChat(context.chatId!), 1000);
  }

  // Log final completion
  log.logToDB({
    level: "info",
    organisationId: context?.organisationId,
    sessionId: context?.userId,
    source: "ai",
    category: "text-generation",
    message: "text-generation-complete",
    metadata: {
      model: providerAndModelName,
      responseLength: accumulatedText.length,
      usedTokens: usage?.totalTokens,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      toolsUsed: tools ? Object.keys(tools) : undefined,
      steps: allSteps.map((step) => ({
        text: step.text,
        toolCalls: step.toolCalls?.map((call: any) => call.toolName),
      })),
    },
  });

  // drop images from message:
  accumulatedText = removeMarkdownImageUrls(accumulatedText);

  return {
    id: nanoid(6),
    text: accumulatedText,
    model: providerAndModelName,
    meta: {
      responseLength: accumulatedText.length,
      usedTokens: usage?.totalTokens,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      toolsUsed: usedTools,
      sources: accumulatedSources,
      artifacts: accumulatedArtifacts,
      steps: allSteps.map((step) => ({
        text: step.text,
        toolCalls: step.toolCalls?.map((call: any) => call.toolName),
      })),
    },
  };
}
