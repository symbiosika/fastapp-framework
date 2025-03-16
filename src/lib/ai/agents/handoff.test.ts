import { describe, test, expect, mock, type Mock } from "bun:test";
import { Agent } from "./agent";
import { handoff, executeHandoff } from "./handoff";
import { Runner } from "./runner";
import { TEST_USER_1, TEST_ORGANISATION_1 } from "../../../test/init.test";
import type { AgentExecution, AgentExecutionResult } from "./types";
import type { ChatSessionContext } from "../chat/chat-store";

// Mock the Runner and nanoid
mock.module("nanoid", () => ({
  nanoid: () => "mock-nanoid-id"
}));

const runMock = mock(() => Promise.resolve({
  output: "Handoff result",
  messages: [{ role: "assistant", content: "Handoff result" }],
  variables: { handoffCompleted: true }
}));

const storeExecutionMock = mock(() => Promise.resolve());

mock.module("./runner", () => ({
  Runner: {
    run: runMock,
    storeExecution: storeExecutionMock
  }
}));

const logCustomMock = mock();

mock.module("../../../lib/log", () => ({
  default: {
    logCustom: logCustomMock
  }
}));

describe("Agent Handoffs", () => {
  test("Create a handoff configuration", () => {
    // Create a target agent
    const targetAgent = new Agent({
      name: "TargetAgent",
      instructions: "You are a specialized agent",
      model: "gpt-3.5-turbo"
    });
    
    // Create a handoff configuration
    const handoffConfig = handoff(targetAgent);
    
    // Verify the handoff configuration
    expect(handoffConfig).toBeDefined();
    expect(handoffConfig.name).toBe("TargetAgent_handoff");
    expect(handoffConfig.instructions).toBe("You are a specialized agent");
    expect(handoffConfig.model).toBe("gpt-3.5-turbo");
  });
  
  test("Create a handoff configuration with custom options", () => {
    // Create a target agent
    const targetAgent = new Agent({
      name: "TargetAgent",
      instructions: "You are a specialized agent",
      model: "gpt-3.5-turbo"
    });
    
    // Create a mock onHandoff function
    const onHandoffMock = mock();
    
    // Create a handoff configuration with custom options
    const handoffConfig = handoff(targetAgent, {
      name: "CustomHandoff",
      description: "Custom handoff description",
      onHandoff: onHandoffMock
    });
    
    // Verify the handoff configuration
    expect(handoffConfig).toBeDefined();
    expect(handoffConfig.name).toBe("CustomHandoff");
    expect(handoffConfig.instructions).toBe("You are a specialized agent");
    expect(handoffConfig.model).toBe("gpt-3.5-turbo");
  });
  
  test("Execute a handoff between agents", async () => {
    // Create source and target agents
    const sourceAgent = new Agent({
      name: "SourceAgent",
      instructions: "You are a source agent",
      model: "gpt-3.5-turbo"
    });
    
    const targetAgent = new Agent({
      name: "TargetAgent",
      instructions: "You are a target agent",
      model: "gpt-3.5-turbo"
    });
    
    // Create a mock execution context
    const context: ChatSessionContext = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };
    
    // Create a source execution
    const sourceExecution: AgentExecution = {
      id: "source-execution-id",
      agentId: sourceAgent.name,
      status: "running",
      startTime: new Date().toISOString(),
      input: "Test input",
      messages: [],
      context,
      variables: {}
    };
    
    // Execute the handoff
    const result = await executeHandoff(sourceExecution, targetAgent);
    
    // Verify the handoff execution
    expect(result).toBeDefined();
    expect(result.output).toBe("Handoff result");
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toBe("Handoff result");
    expect(result.variables).toEqual({ handoffCompleted: true });
    
    // Verify that Runner.run was called with the correct parameters
    expect(runMock).toHaveBeenCalledWith(targetAgent, "Test input", context);
    
    // Verify that the source execution was updated with the child execution
    expect(sourceExecution.childExecutions).toEqual(["mock-nanoid-id"]);
    
    // Verify that storeExecution was called
    expect(storeExecutionMock).toHaveBeenCalled();
  });
  
  test("Execute a handoff with custom input", async () => {
    // Create source and target agents
    const sourceAgent = new Agent({
      name: "SourceAgent",
      instructions: "You are a source agent",
      model: "gpt-3.5-turbo"
    });
    
    const targetAgent = new Agent({
      name: "TargetAgent",
      instructions: "You are a target agent",
      model: "gpt-3.5-turbo"
    });
    
    // Create a mock execution context
    const context: ChatSessionContext = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };
    
    // Create a source execution
    const sourceExecution: AgentExecution = {
      id: "source-execution-id",
      agentId: sourceAgent.name,
      status: "running",
      startTime: new Date().toISOString(),
      input: "Original input",
      messages: [],
      context,
      variables: {}
    };
    
    // Execute the handoff with custom input
    const customInput = "Custom input for handoff";
    const result = await executeHandoff(sourceExecution, targetAgent, customInput);
    
    // Verify that Runner.run was called with the custom input
    expect(runMock).toHaveBeenCalledWith(targetAgent, customInput, context);
  });
  
  test("Handle errors during handoff execution", async () => {
    // Mock Runner.run to throw an error
    runMock.mockImplementationOnce(() => {
      throw new Error("Handoff failed");
    });
    
    // Create source and target agents
    const sourceAgent = new Agent({
      name: "SourceAgent",
      instructions: "You are a source agent",
      model: "gpt-3.5-turbo"
    });
    
    const targetAgent = new Agent({
      name: "TargetAgent",
      instructions: "You are a target agent",
      model: "gpt-3.5-turbo"
    });
    
    // Create a mock execution context
    const context: ChatSessionContext = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };
    
    // Create a source execution
    const sourceExecution: AgentExecution = {
      id: "source-execution-id",
      agentId: sourceAgent.name,
      status: "running",
      startTime: new Date().toISOString(),
      input: "Test input",
      messages: [],
      context,
      variables: {}
    };
    
    // Execute the handoff and expect it to throw
    await expect(executeHandoff(sourceExecution, targetAgent)).rejects.toThrow("Handoff failed");
    
    // Verify that storeExecution was called
    expect(storeExecutionMock).toHaveBeenCalled();
  });
}); 