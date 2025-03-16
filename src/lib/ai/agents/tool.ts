import { ChatSessionContext } from "../chat/chat-store";
import { AgentTool } from "./types";
import { textToSpeech, speechToText } from "../standard";

/**
 * Create a function tool that can be used by an agent
 * @param fn The function to execute
 * @param options Tool configuration options
 * @returns An AgentTool object
 */
export function functionTool<T extends Record<string, any>>(
  fn: (args: T, context: ChatSessionContext) => Promise<any> | any,
  options: {
    name?: string;
    description?: string;
    parameters?: Record<string, any>;
  } = {}
): AgentTool {
  const fnName = options.name || fn.name;
  if (!fnName) {
    throw new Error(
      "Function tool must have a name. Either provide a named function or specify a name in options."
    );
  }

  return {
    name: fnName,
    description: options.description || `Execute the ${fnName} function`,
    parameters: options.parameters || {},
    function: async (args: T, context: ChatSessionContext) => {
      const result = fn(args, context);
      return result instanceof Promise ? await result : result;
    },
  };
}

/**
 * Create a web search tool that can be used by an agent
 * @param options Tool configuration options
 * @returns An AgentTool object
 */
export function webSearchTool(
  options: {
    name?: string;
    description?: string;
    maxResults?: number;
  } = {}
): AgentTool {
  return {
    name: options.name || "web_search",
    description: options.description || "Search the web for information",
    parameters: {
      query: {
        type: "string",
        description: "The search query",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of results to return",
        default: options.maxResults || 5,
      },
    },
    function: async (
      args: { query: string; maxResults?: number },
      context: ChatSessionContext
    ) => {
      // This is a placeholder for actual web search implementation
      return {
        results: [
          {
            title: `Search result for: ${args.query}`,
            url: "https://example.com",
            snippet: `This is a placeholder result for the query: ${args.query}`,
          },
        ],
      };
    },
  };
}

/**
 * Create a text-to-speech tool that can be used by an agent
 * @param options Tool configuration options
 * @returns An AgentTool object
 */
export function textToSpeechTool(
  options: {
    name?: string;
    description?: string;
    voice?: string;
    speed?: number;
  } = {}
): AgentTool {
  return {
    name: options.name || "text_to_speech",
    description: options.description || "Convert text to speech audio",
    parameters: {
      text: {
        type: "string",
        description: "The text to convert to speech",
      },
      voice: {
        type: "string",
        description: "The voice to use for the speech",
        default: options.voice || "alloy",
      },
      speed: {
        type: "number",
        description: "The speed of the speech (0.25 to 4.0)",
        default: options.speed || 1.0,
      },
    },
    function: async (
      args: { text: string; voice?: string; speed?: number },
      context: ChatSessionContext
    ) => {
      try {
        const result = await textToSpeech(
          args.text,
          {
            voice: args.voice,
          },
          {
            organisationId: context.organisationId,
            userId: context.userId,
          }
        );

        return {
          success: true,
          file: result.file,
          filename: result.filename,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}

/**
 * Create a speech-to-text tool that can be used by an agent
 * @param options Tool configuration options
 * @returns An AgentTool object
 */
export function speechToTextTool(
  options: {
    name?: string;
    description?: string;
    returnSegments?: boolean;
    returnWords?: boolean;
  } = {}
): AgentTool {
  return {
    name: options.name || "speech_to_text",
    description: options.description || "Convert speech audio to text",
    parameters: {
      filePath: {
        type: "string",
        description: "The path to the audio file to transcribe",
      },
      returnSegments: {
        type: "boolean",
        description: "Whether to return segments in the transcription",
        default: options.returnSegments || false,
      },
      returnWords: {
        type: "boolean",
        description: "Whether to return word-level timestamps",
        default: options.returnWords || false,
      },
    },
    function: async (
      args: {
        filePath: string;
        returnSegments?: boolean;
        returnWords?: boolean;
      },
      context: ChatSessionContext
    ) => {
      try {
        const result = await speechToText(
          {
            filePath: args.filePath,
          },
          {
            returnSegments: args.returnSegments,
            returnWords: args.returnWords,
          },
          {
            organisationId: context.organisationId,
            userId: context.userId,
          }
        );

        return {
          success: true,
          text: result.text,
          segments: result.segments,
          words: result.words,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}
