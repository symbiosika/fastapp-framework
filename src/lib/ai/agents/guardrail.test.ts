import { describe, test, expect, mock } from "bun:test";
import { 
  createInputGuardrail, 
  createOutputGuardrail, 
  createContentModerationGuardrail,
  createPiiDetectionGuardrail
} from "./guardrail";
import { TEST_USER_1, TEST_ORGANISATION_1 } from "../../../test/init.test";
import type { ChatMessage, ChatSessionContext } from "../chat/chat-store";
import type { InputGuardrailResult, OutputGuardrailResult } from "./types";

describe("Agent Guardrails", () => {
  test("Create an input guardrail with a named function", async () => {
    async function checkInput(
      input: string | ChatMessage[], 
      context: ChatSessionContext
    ): Promise<InputGuardrailResult> {
      const inputText = typeof input === 'string' ? input : input.map(msg => typeof msg.content === 'string' ? msg.content : '').join(' ');
      return {
        allowed: inputText.length > 5,
        reason: inputText.length > 5 ? undefined : "Input too short"
      };
    }

    const guardrail = createInputGuardrail(checkInput);
    
    expect(guardrail).toBeDefined();
    expect(guardrail.name).toBe("checkInput");
    expect(guardrail.description).toContain("checkInput");
    expect(guardrail.check).toBeDefined();
    
    // Test the check function with valid input
    const context: ChatSessionContext = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };
    
    const validResult = await guardrail.check("Valid input", context);
    expect(validResult).toBeDefined();
    expect(validResult.allowed).toBe(true);
    expect(validResult.reason).toBeUndefined();
    
    // Test the check function with invalid input
    const invalidResult = await guardrail.check("Short", context);
    expect(invalidResult).toBeDefined();
    expect(invalidResult.allowed).toBe(false);
    expect(invalidResult.reason).toBe("Input too short");
  });

  test("Create an input guardrail with an anonymous function and options", async () => {
    const guardrail = createInputGuardrail(
      async (input: string | ChatMessage[], context: ChatSessionContext): Promise<InputGuardrailResult> => {
        const inputText = typeof input === 'string' ? input : input.map(msg => typeof msg.content === 'string' ? msg.content : '').join(' ');
        return {
          allowed: !inputText.includes("bad"),
          reason: inputText.includes("bad") ? "Input contains bad word" : undefined
        };
      },
      {
        name: "profanityFilter",
        description: "Filter out profanity"
      }
    );
    
    expect(guardrail).toBeDefined();
    expect(guardrail.name).toBe("profanityFilter");
    expect(guardrail.description).toBe("Filter out profanity");
    
    // Test the check function
    const context: ChatSessionContext = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };
    
    const validResult = await guardrail.check("Good input", context);
    expect(validResult.allowed).toBe(true);
    
    const invalidResult = await guardrail.check("This is bad input", context);
    expect(invalidResult.allowed).toBe(false);
    expect(invalidResult.reason).toBe("Input contains bad word");
  });

  test("Create an output guardrail", async () => {
    const guardrail = createOutputGuardrail(
      async (output: any, context: ChatSessionContext): Promise<OutputGuardrailResult> => {
        const outputText = typeof output === 'string' ? output : String(output);
        return {
          allowed: outputText.length < 100,
          reason: outputText.length < 100 ? undefined : "Output too long",
          modifiedOutput: outputText.length < 100 ? undefined : outputText.substring(0, 97) + "..."
        };
      },
      {
        name: "lengthLimiter",
        description: "Limit output length"
      }
    );
    
    expect(guardrail).toBeDefined();
    expect(guardrail.name).toBe("lengthLimiter");
    expect(guardrail.description).toBe("Limit output length");
    
    // Test the check function with valid output
    const context: ChatSessionContext = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };
    
    const validResult = await guardrail.check("Short output", context);
    expect(validResult.allowed).toBe(true);
    expect(validResult.modifiedOutput).toBeUndefined();
    
    // Test the check function with output that needs modification
    const longOutput = "This is a very long output that exceeds the limit of 100 characters and should be truncated by the guardrail function to a shorter version.";
    const modifiedResult = await guardrail.check(longOutput, context);
    expect(modifiedResult.allowed).toBe(false);
    expect(modifiedResult.reason).toBe("Output too long");
    expect(modifiedResult.modifiedOutput).toBeDefined();
    expect(modifiedResult.modifiedOutput?.length).toBeLessThan(longOutput.length);
    expect(modifiedResult.modifiedOutput).toEndWith("...");
  });

  test("Create a content moderation guardrail", async () => {
    const guardrail = createContentModerationGuardrail();
    
    expect(guardrail).toBeDefined();
    expect(guardrail.name).toBe("content_moderation");
    expect(guardrail.description).toContain("inappropriate content");
    
    // Test the check function with safe content
    const context: ChatSessionContext = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };
    
    const safeResult = await guardrail.check("Safe content", context);
    expect(safeResult.allowed).toBe(true);
    
    // Test the check function with unsafe content
    const unsafeResult = await guardrail.check("This contains inappropriate content", context);
    expect(unsafeResult.allowed).toBe(false);
    expect(unsafeResult.reason).toBeDefined();
  });

  test("Create a PII detection guardrail", async () => {
    const guardrail = createPiiDetectionGuardrail();
    
    expect(guardrail).toBeDefined();
    expect(guardrail.name).toBe("pii_detection");
    expect(guardrail.description).toContain("personally identifiable information");
    
    // Test the check function with safe content
    const context: ChatSessionContext = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };
    
    const safeResult = await guardrail.check("Safe content without PII", context);
    expect(safeResult.allowed).toBe(true);
    
    // Test the check function with content containing PII (SSN)
    const unsafeResult = await guardrail.check("My SSN is 123-45-6789", context);
    expect(unsafeResult.allowed).toBe(false);
    expect(unsafeResult.reason).toBeDefined();
  });
}); 