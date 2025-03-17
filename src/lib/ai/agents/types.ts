import type {
  ChatMessage,
  ChatSessionContext,
  ChatStoreVariables,
} from "../chat/chat-store";

export type AgentExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type AgentTool = {
  name: string;
  description: string;
  parameters?: Record<string, any>;
  function: (args: any, context: ChatSessionContext) => Promise<any>;
};

export type AgentModelSettings = {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  responseFormat?: {
    type: "text" | "json_object";
  };
};

export type AgentConfig = {
  name: string;
  instructions: string | ((context: ChatSessionContext) => string);
  model: string;
  modelSettings?: AgentModelSettings;
  tools?: AgentTool[];
  handoffs?: AgentConfig[];
  outputType?: any;
};

export type AgentExecution = {
  id: string;
  agentId: string;
  status: AgentExecutionStatus;
  startTime: string;
  endTime?: string;
  input: string | ChatMessage[];
  output?: any;
  messages: ChatMessage[];
  context: ChatSessionContext;
  variables: ChatStoreVariables;
  error?: string;
  parentExecutionId?: string;
  childExecutions?: string[];
};

export type AgentExecutionResult = {
  output: any;
  messages: ChatMessage[];
  variables: ChatStoreVariables;
};

export type InputGuardrailResult = {
  allowed: boolean;
  reason?: string;
};

export type OutputGuardrailResult = {
  allowed: boolean;
  reason?: string;
  modifiedOutput?: any;
};

export type InputGuardrail = {
  name: string;
  description: string;
  check: (
    input: string | ChatMessage[],
    context: ChatSessionContext
  ) => Promise<InputGuardrailResult>;
};

export type OutputGuardrail = {
  name: string;
  description: string;
  check: (
    output: any,
    context: ChatSessionContext
  ) => Promise<OutputGuardrailResult>;
};

export type AgentHooks = {
  onStart?: (execution: AgentExecution) => Promise<void>;
  onEnd?: (execution: AgentExecution) => Promise<void>;
  onError?: (execution: AgentExecution, error: Error) => Promise<void>;
  onToolStart?: (execution: AgentExecution, tool: AgentTool) => Promise<void>;
  onToolEnd?: (
    execution: AgentExecution,
    tool: AgentTool,
    result: any
  ) => Promise<void>;
  onHandoffStart?: (
    execution: AgentExecution,
    handoff: AgentConfig
  ) => Promise<void>;
  onHandoffEnd?: (
    execution: AgentExecution,
    handoff: AgentConfig,
    result: any
  ) => Promise<void>;
};
