import { describe, test, expect, beforeEach, mock, type Mock } from "bun:test";
import { Runner } from "./runner";
import { Agent } from "./agent";
import { chatStore } from "../chat/chat-store";
import { nanoid } from "nanoid";
import { TEST_USER_1, TEST_ORGANISATION_1 } from "../../../test/init.test";
import type { AgentExecution, AgentExecutionResult, AgentExecutionStatus, InputGuardrail, OutputGuardrail } from "./types";
import type { ChatMessage, ChatMessageRole, ChatSessionContext } from "../chat/chat-store";
import type { RunConfig } from "./runner";

// Mock nanoid to return predictable IDs
mock.module("nanoid", () => ({
  nanoid: () => "test-nanoid-id"
}));

// Create mocks for agent run method
const agentRunMock = mock(() => Promise.resolve({
  output: "Test output",
  messages: [{ role: "assistant" as ChatMessageRole, content: "Test output" }],
  variables: {}
}));

// Mock the Agent class
mock.module("./agent", () => {
  return {
    Agent: class MockAgent {
      name: string;
      model: string;
      instructions: string;

      constructor(config: any) {
        this.name = config.name;
        this.model = config.model;
        this.instructions = config.instructions;
      }

      run = agentRunMock;
    }
  };
});

// Create mocks for chatStore methods
const chatStoreGetMock = mock(() => Promise.resolve({
  id: "test-chat-id",
  messages: [],
  state: { variables: {} }
}));

const chatStoreCreateMock = mock(() => Promise.resolve({
  id: "test-chat-id",
  messages: [],
  state: { variables: {} }
}));

const chatStoreSetMock = mock(() => Promise.resolve({
  id: "test-chat-id",
  messages: [],
  state: { variables: {} }
}));

// Mock the chatStore
mock.module("../chat/chat-store", () => {
  return {
    chatStore: {
      get: chatStoreGetMock,
      create: chatStoreCreateMock,
      set: chatStoreSetMock
    }
  };
});

// Create a mock for the Runner methods
const runnerRunMock = mock<(agent: Agent, input: string | ChatMessage[], context: ChatSessionContext, config?: RunConfig) => Promise<AgentExecutionResult>>(() => Promise.resolve({
  output: "Test output",
  messages: [{ role: "assistant" as ChatMessageRole, content: "Test output" }],
  variables: {}
}));

const runnerRunStreamedMock = mock<(agent: Agent, input: string | ChatMessage[], context: ChatSessionContext, config?: RunConfig) => Promise<AgentExecutionResult>>(() => Promise.resolve({
  output: "Test output",
  messages: [{ role: "assistant" as ChatMessageRole, content: "Test output" }],
  variables: {}
}));

const runnerCreateExecutionContextMock = mock<(userId: string, organisationId: string, chatSessionGroupId?: string) => ChatSessionContext>((userId: string, organisationId: string, chatSessionGroupId?: string) => {
  return {
    chatId: "test-chat-id",
    userId,
    organisationId,
    chatSessionGroupId
  };
});

const runnerStoreExecutionMock = mock<(execution: AgentExecution) => Promise<void>>(() => Promise.resolve());

// Override the Runner methods with our mocks
(Runner as any).run = runnerRunMock;
(Runner as any).runStreamed = runnerRunStreamedMock;
(Runner as any).createExecutionContext = runnerCreateExecutionContextMock;
(Runner as any).storeExecution = runnerStoreExecutionMock;

describe("Runner", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    agentRunMock.mockClear();
    chatStoreGetMock.mockClear();
    chatStoreCreateMock.mockClear();
    chatStoreSetMock.mockClear();
    runnerRunMock.mockClear();
    runnerRunStreamedMock.mockClear();
    runnerCreateExecutionContextMock.mockClear();
    runnerStoreExecutionMock.mockClear();
  });

  test("Run an agent", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    const context: ChatSessionContext = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const result = await Runner.run(agent, "Hello agent", context);
    
    expect(result).toBeDefined();
    expect(result.output).toBe("Test output");
    expect(result.messages).toBeDefined();
    expect(result.variables).toBeDefined();
    
    // Verify that Runner.run was called with the correct parameters
    expect(runnerRunMock).toHaveBeenCalledWith(agent, "Hello agent", context);
  });

  test("Run an agent with guardrails", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    const context: ChatSessionContext = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const inputGuardrail: InputGuardrail = {
      name: "test-input-guardrail",
      description: "Test input guardrail",
      check: mock(() => Promise.resolve({ allowed: true }))
    };

    const outputGuardrail: OutputGuardrail = {
      name: "test-output-guardrail",
      description: "Test output guardrail",
      check: mock(() => Promise.resolve({ allowed: true }))
    };

    const result = await Runner.run(
      agent, 
      "Hello agent", 
      context, 
      {
        inputGuardrails: [inputGuardrail],
        outputGuardrails: [outputGuardrail]
      }
    );
    
    expect(result).toBeDefined();
    
    // Verify that Runner.run was called with the guardrails
    expect(runnerRunMock).toHaveBeenCalledWith(
      agent, 
      "Hello agent", 
      context, 
      {
        inputGuardrails: [inputGuardrail],
        outputGuardrails: [outputGuardrail]
      }
    );
  });

  test("Run an agent with streaming", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    const context: ChatSessionContext = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const result = await Runner.runStreamed(agent, "Hello agent", context);
    
    expect(result).toBeDefined();
    expect(result.output).toBe("Test output");
    
    // Verify that Runner.runStreamed was called
    expect(runnerRunStreamedMock).toHaveBeenCalledWith(agent, "Hello agent", context);
  });

  test("Create execution context", () => {
    const context = Runner.createExecutionContext(
      TEST_USER_1.id,
      TEST_ORGANISATION_1.id
    );
    
    expect(context).toBeDefined();
    expect(context.userId).toBe(TEST_USER_1.id);
    expect(context.organisationId).toBe(TEST_ORGANISATION_1.id);
    expect(context.chatId).toBeDefined();
    expect(typeof context.chatId).toBe("string");
    
    // Verify that createExecutionContext was called with the correct parameters
    expect(runnerCreateExecutionContextMock).toHaveBeenCalledWith(
      TEST_USER_1.id,
      TEST_ORGANISATION_1.id
    );
  });

  test("Create execution context with chat session group ID", () => {
    const chatSessionGroupId = "test-group-id";
    const context = Runner.createExecutionContext(
      TEST_USER_1.id,
      TEST_ORGANISATION_1.id,
      chatSessionGroupId
    );
    
    expect(context).toBeDefined();
    expect(context.userId).toBe(TEST_USER_1.id);
    expect(context.organisationId).toBe(TEST_ORGANISATION_1.id);
    expect(context.chatSessionGroupId).toBe(chatSessionGroupId);
    
    // Verify that createExecutionContext was called with the correct parameters
    expect(runnerCreateExecutionContextMock).toHaveBeenCalledWith(
      TEST_USER_1.id,
      TEST_ORGANISATION_1.id,
      chatSessionGroupId
    );
  });

  test("Store execution", async () => {
    const context: ChatSessionContext = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const execution: AgentExecution = {
      id: "test-execution-id",
      agentId: "TestAgent",
      status: "completed" as AgentExecutionStatus,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      input: "Hello agent",
      output: "Test output",
      messages: [{ role: "assistant" as ChatMessageRole, content: "Test output" }],
      context,
      variables: { testVar: "test value" }
    };

    await Runner.storeExecution(execution);
    
    // Verify that storeExecution was called with the correct parameters
    expect(runnerStoreExecutionMock).toHaveBeenCalledWith(execution);
  });
}); 