import { LLMOptions } from "../../../dbSchema";
import type { ChatMessage, ChatSessionContext } from "../chat/chat-store";

export type AgentExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type AgentInputSchema = Record<
  string,
  {
    type: "text" | "file" | "number" | "boolean" | "array";
    description: string;
    required: boolean;
    default?: any;
  }
>;

export type AgentOutputSchema = Record<
  string,
  {
    type: "text" | "file" | "number" | "boolean" | "array";
    description: string;
  }
>;

export type AgentDefinition = {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: AgentInputSchema;
  outputSchema: AgentOutputSchema;
  visibleToUser: boolean;
  isAsynchronous: boolean;
  config?: Record<string, any>;
};

export type AgentExecution = {
  id: string;
  agentId: string;
  status: AgentExecutionStatus;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: string;
  startTime: string;
  endTime?: string;
  progress?: number; // 0-100
  progressMessage?: string; // optional to display in the UI
  metadata?: Record<string, any>;
};

export type BaseAgent = {
  // Returns the definition of the agent
  getDefinition(): AgentDefinition;

  // Validates the inputs against the schema
  validateInputs(inputs: Record<string, any>): boolean;

  // Starts an agent execution
  run(
    context: ChatSessionContext,
    messages: ChatMessage[],
    variables: Record<string, any>,
    modelOptions: LLMOptions
  ): Promise<AgentExecution>;

  // Returns the current status of an execution
  getExecutionStatus(executionId: string): Promise<AgentExecution | null>;

  // Cancels a running execution
  cancel(executionId: string): Promise<boolean>;
};
