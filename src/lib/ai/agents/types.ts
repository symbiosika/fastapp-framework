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

// Types for ReAct pattern and Flow Agents

export enum AgentState {
  IDLE = "idle",
  THINKING = "thinking",
  ACTING = "acting",
  RUNNING = "running",
  FINISHED = "finished",
  ERROR = "error",
}

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  inputSchema: AgentInputSchema;
  outputSchema: AgentOutputSchema;
};

export type ToolExecution = {
  id: string;
  toolId: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: string;
  startTime: string;
  endTime?: string;
};

export type AgentTool = {
  definition: ToolDefinition;
  execute(inputs: Record<string, any>): Promise<Record<string, any>>;
};

export type PlanStep = {
  id: string;
  description: string;
  status: PlanStepStatus;
  dependencies: string[];
  agentId?: string;
  toolId?: string;
  result?: string;
};

export enum PlanStepStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  BLOCKED = "blocked",
  FAILED = "failed",
}

export type Plan = {
  id: string;
  goal: string;
  steps: PlanStep[];
};

export type FlowExecution = AgentExecution & {
  plan?: Plan;
  currentStepIndex?: number;
  tools?: Record<string, ToolExecution>;
  subAgents?: Record<string, AgentExecution>;
};

export type AgentInputVariables = Record<string, any>;
