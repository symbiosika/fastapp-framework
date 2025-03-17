import type { ChatMessage, ChatSessionContext } from "../chat/chat-store";
import type {
  InputGuardrail,
  InputGuardrailResult,
  OutputGuardrail,
  OutputGuardrailResult,
} from "./types";

/**
 * Create an input guardrail that checks user input before it's processed by an agent
 * @param checkFn The function that checks the input
 * @param options Guardrail configuration options
 * @returns An InputGuardrail object
 */
export function createInputGuardrail(
  checkFn: (
    input: string | ChatMessage[],
    context: ChatSessionContext
  ) => Promise<InputGuardrailResult> | InputGuardrailResult,
  options: {
    name?: string;
    description?: string;
  } = {}
): InputGuardrail {
  const guardrailName = options.name || checkFn.name || "input_guardrail";

  return {
    name: guardrailName,
    description: options.description || `Check input with ${guardrailName}`,
    check: async (
      input: string | ChatMessage[],
      context: ChatSessionContext
    ) => {
      const result = checkFn(input, context);
      return result instanceof Promise ? await result : result;
    },
  };
}

/**
 * Create an output guardrail that checks agent output before it's returned
 * @param checkFn The function that checks the output
 * @param options Guardrail configuration options
 * @returns An OutputGuardrail object
 */
export function createOutputGuardrail(
  checkFn: (
    output: any,
    context: ChatSessionContext
  ) => Promise<OutputGuardrailResult> | OutputGuardrailResult,
  options: {
    name?: string;
    description?: string;
  } = {}
): OutputGuardrail {
  const guardrailName = options.name || checkFn.name || "output_guardrail";

  return {
    name: guardrailName,
    description: options.description || `Check output with ${guardrailName}`,
    check: async (output: any, context: ChatSessionContext) => {
      const result = checkFn(output, context);
      return result instanceof Promise ? await result : result;
    },
  };
}

/**
 * Create a content moderation guardrail that checks for inappropriate content
 * @returns An InputGuardrail object
 */
export function createContentModerationGuardrail(): InputGuardrail {
  return createInputGuardrail(
    async (input: string | ChatMessage[], context: ChatSessionContext) => {
      // Extract text content from input
      const textContent =
        typeof input === "string"
          ? input
          : input
              .map((msg) =>
                typeof msg.content === "string" ? msg.content : ""
              )
              .join(" ");

      // This is a placeholder for actual content moderation implementation
      // In a real implementation, you would call a content moderation API
      const isSafe = !textContent.includes("inappropriate");

      return {
        allowed: isSafe,
        reason: isSafe ? undefined : "Content contains inappropriate language",
      };
    },
    {
      name: "content_moderation",
      description: "Check input for inappropriate content",
    }
  );
}

/**
 * Create a PII detection guardrail that checks for personally identifiable information
 * @returns An InputGuardrail object
 */
export function createPiiDetectionGuardrail(): InputGuardrail {
  return createInputGuardrail(
    async (input: string | ChatMessage[], context: ChatSessionContext) => {
      // Extract text content from input
      const textContent =
        typeof input === "string"
          ? input
          : input
              .map((msg) =>
                typeof msg.content === "string" ? msg.content : ""
              )
              .join(" ");

      // This is a placeholder for actual PII detection implementation
      // In a real implementation, you would use a PII detection library or API
      const hasPii = /\b\d{3}-\d{2}-\d{4}\b/.test(textContent); // Simple SSN pattern

      return {
        allowed: !hasPii,
        reason: hasPii
          ? "Content contains personally identifiable information"
          : undefined,
      };
    },
    {
      name: "pii_detection",
      description: "Check input for personally identifiable information",
    }
  );
}
