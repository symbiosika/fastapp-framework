import { CoreMessage, embed, generateText } from "ai";
import { UserContext } from "./types";
import { getAIEmbeddingModel, getAIModel } from "./get-model";
import { encodeImageFromFile } from "./utils";
import log from "../../log";
import { LanguageModelV1 } from "ai";
import { nanoid } from "nanoid";
import { getToolsDictionary } from "../interaction/tools";

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

export interface SourceReturn {
  type: "url" | "knowledge-chunk" | "knowledge-entry";
  id?: string;
  url?: string;
  external?: boolean;
}

/**
 * Generate an embedding for the given text using AI SDK
 */
export async function generateEmbedding(
  text: string,
  context: UserContext,
  providerAndModelName?: string
) {
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
  context: UserContext,
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
 * Will respond with plain Text only.
 */
export async function chatCompletion(
  messages: CoreMessage[],
  context: UserContext,
  options?: {
    providerAndModelName?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: string[];
  }
) {
  let providerAndModelName = options?.providerAndModelName;
  if (!providerAndModelName) {
    providerAndModelName =
      process.env.DEFAULT_CHAT_COMPLETION_MODEL ?? "openai:gpt-4o-mini";
  }

  const model = await getAIModel(providerAndModelName, context);

  // get all tools filtered by the provided tool names
  const tools = options?.tools ? getToolsDictionary(options.tools) : undefined;

  // Use generateText with maxSteps for automatic tool handling
  const { text, steps, usage } = await generateText({
    model: model as LanguageModelV1,
    messages,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
    tools,
    // Let the model decide when to use tools
    toolChoice: tools && Object.keys(tools).length > 0 ? "auto" : "none",
    // Allow multiple steps for tool usage and follow-up responses
    maxSteps: 5,
    // Optional: Log each step for debugging
    onStepFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
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
          toolCalls: (toolCalls as ToolCall[])?.map((call) => call.toolName),
          toolResults: (toolResults as ToolResult[])?.map(
            (result) => result.toolName
          ),
          finishReason,
          usage,
        },
      });
    },
  });

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
      responseLength: text.length,
      usedTokens: usage?.totalTokens,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      toolsUsed: tools ? Object.keys(tools) : undefined,
      steps: (steps as Step[])?.map((step) => ({
        text: step.text,
        toolCalls: step.toolCalls?.map((call) => call.toolName),
        toolResults: step.toolResults?.map((result) => result.toolName),
      })),
    },
  });

  const sources: SourceReturn[] = [];
  (steps as Step[])?.forEach((step) => {
    step.sources?.forEach((source) => {
      if (source.sourceType === "url") {
        sources.push({
          type: "url",
          url: source.url,
          external: true,
        });
      }
    });
  });

  return {
    id: nanoid(6),
    text,
    model: providerAndModelName,
    meta: {
      responseLength: text.length,
      usedTokens: usage?.totalTokens,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
      toolsUsed: tools ? Object.keys(tools) : undefined,
      steps: (steps as Step[])?.map((step) => ({
        text: step.text,
        toolCalls: step.toolCalls?.map((call) => call.toolName),
        toolResults: step.toolResults?.map((result) => result.toolName),
      })),
      sources: sources,
    },
  };
}
