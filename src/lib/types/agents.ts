import type { ChatStoreVariables } from "../ai/chat/chat-store";

export type AgentOutputVariables = ChatStoreVariables & {
  default: string;
};

export type SimpleVariableType = string | number | boolean | undefined;

export type AgentOptions = Record<string, SimpleVariableType>;

/**
 * The base interface for any "Agent".
 * Each Agent has a run method that accepts:
 * - context: execution context such as userId, organisationId, etc.
 * - inputs: a dictionary of input values
 * - options: a dictionary of options
 * 
 * It returns a promise with an output dictionary
 * that can contain text, audio URLs, or any other data.
 */
export interface Agent {
  name: string; // e.g. "llmAgent", "ttsAgent", etc.

  /**
   * Executes the agent’s functionality.
   */
  run(
    context: AgentContext,
    inputs: ChatStoreVariables,
    options: AgentOptions
  ): Promise<AgentOutput>;
}

export interface AgentContext {
  userId: string;
  organisationId: string;
  chatSessionGroupId?: string;
}

export interface AgentOutput {
  /**
   * This is the main output dictionary of an agent.
   * "default" might be the default text output for an LLM,
   * or a TTS agent might produce an "audioUrl".
   */
  outputs: AgentOutputVariables;

  /**
   * If needed, we can also supply any extra metadata about the run.
   */
  metadata?: ChatStoreVariables;
}
