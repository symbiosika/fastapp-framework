import { describe, test, expect, beforeAll, mock, type Mock } from "bun:test";
import { Agent } from "./agent";
import { chatStore } from "../chat/chat-store";
import { nanoid } from "nanoid";
import { TEST_USER_1, TEST_ORGANISATION_1 } from "../../../test/init.test";
import type { ChatMessage, ChatMessageRole } from "../chat/chat-store";

// Mock the chatStore
mock.module("../chat/chat-store", () => {
  return {
    chatStore: {
      get: mock(() => Promise.resolve({
        id: "test-chat-id",
        messages: [],
        state: { variables: {} }
      })),
      create: mock(() => Promise.resolve({
        id: "test-chat-id",
        messages: [],
        state: { variables: {} }
      })),
      set: mock(() => Promise.resolve({
        id: "test-chat-id",
        messages: [],
        state: { variables: {} }
      }))
    }
  };
});

describe("Agent", () => {
  test("Create a new agent", () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    expect(agent).toBeDefined();
    expect(agent.name).toBe("TestAgent");
    expect(agent.model).toBe("gpt-4");
  });

  test("Clone an agent with overrides", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    const clonedAgent = agent.clone({
      name: "ClonedAgent",
      model: "gpt-3.5-turbo"
    });

    expect(clonedAgent.name).toBe("ClonedAgent");
    expect(clonedAgent.model).toBe("gpt-3.5-turbo");
    // Original instructions should be preserved
    const prompt = await clonedAgent.getSystemPrompt({ 
      chatId: "test-chat-id", 
      userId: TEST_USER_1.id, 
      organisationId: TEST_ORGANISATION_1.id 
    });
    expect(prompt).toBe("You are a test agent");
  });

  test("Get system prompt from string instructions", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const prompt = await agent.getSystemPrompt(context);
    expect(prompt).toBe("You are a test agent");
  });

  test("Get system prompt from function instructions", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: (context) => `You are a test agent for ${context.userId}`,
      model: "gpt-4"
    });

    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const prompt = await agent.getSystemPrompt(context);
    expect(prompt).toBe(`You are a test agent for ${TEST_USER_1.id}`);
  });

  test("Run agent with string input", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const result = await agent.run("Hello agent", context);
    
    expect(result).toBeDefined();
    expect(result.output).toBeDefined();
    expect(result.messages.length).toBeGreaterThan(0);
    
    // Verify that chatStore.get was called
    expect(chatStore.get).toHaveBeenCalledWith("test-chat-id");
    
    // Verify that chatStore.set was called to update messages
    expect(chatStore.set).toHaveBeenCalled();
  });

  test("Run agent with message array input", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const messages: ChatMessage[] = [
      {
        role: "user" as ChatMessageRole,
        content: "Hello agent",
        meta: {
          id: nanoid(10),
          timestamp: new Date().toISOString(),
          human: true
        }
      }
    ];

    const result = await agent.run(messages, context);
    
    expect(result).toBeDefined();
    expect(result.output).toBeDefined();
    expect(result.messages.length).toBeGreaterThan(0);
    
    // Verify that chatStore.get was called
    expect(chatStore.get).toHaveBeenCalledWith("test-chat-id");
    
    // Verify that chatStore.set was called to update messages
    expect(chatStore.set).toHaveBeenCalled();
  });

  test("Run agent with input guardrails", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const inputGuardrail = {
      name: "test-guardrail",
      description: "Test guardrail",
      check: mock(() => Promise.resolve({ allowed: true }))
    };

    const result = await agent.run("Hello agent", context, [inputGuardrail]);
    
    expect(result).toBeDefined();
    expect(inputGuardrail.check).toHaveBeenCalled();
  });

  test("Run agent with failing input guardrail", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const inputGuardrail = {
      name: "test-guardrail",
      description: "Test guardrail",
      check: mock(() => Promise.resolve({ 
        allowed: false, 
        reason: "Test failure reason" 
      }))
    };

    try {
      await agent.run("Hello agent", context, [inputGuardrail]);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Input guardrail");
      expect(error.message).toContain("test-guardrail");
      expect(error.message).toContain("Test failure reason");
    }
    
    expect(inputGuardrail.check).toHaveBeenCalled();
  });

  test("Run agent with output guardrails", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const outputGuardrail = {
      name: "test-guardrail",
      description: "Test guardrail",
      check: mock(() => Promise.resolve({ allowed: true }))
    };

    const result = await agent.run("Hello agent", context, [], [outputGuardrail]);
    
    expect(result).toBeDefined();
    expect(outputGuardrail.check).toHaveBeenCalled();
  });

  test("Run agent with failing output guardrail", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const outputGuardrail = {
      name: "test-guardrail",
      description: "Test guardrail",
      check: mock(() => Promise.resolve({ 
        allowed: false, 
        reason: "Test failure reason" 
      }))
    };

    try {
      await agent.run("Hello agent", context, [], [outputGuardrail]);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Output guardrail");
      expect(error.message).toContain("test-guardrail");
      expect(error.message).toContain("Test failure reason");
    }
    
    expect(outputGuardrail.check).toHaveBeenCalled();
  });

  test("Run agent with output guardrail that modifies output", async () => {
    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    });

    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const outputGuardrail = {
      name: "test-guardrail",
      description: "Test guardrail",
      check: mock(() => Promise.resolve({ 
        allowed: true, 
        modifiedOutput: "Modified output" 
      }))
    };

    const result = await agent.run("Hello agent", context, [], [outputGuardrail]);
    
    expect(result).toBeDefined();
    expect(result.output).toBe("Modified output");
    expect(outputGuardrail.check).toHaveBeenCalled();
  });

  test("Run agent with hooks", async () => {
    const onStart = mock(() => Promise.resolve());
    const onEnd = mock(() => Promise.resolve());

    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    }, {
      onStart,
      onEnd
    });

    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    const result = await agent.run("Hello agent", context);
    
    expect(result).toBeDefined();
    expect(onStart).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
  });

  test("Run agent with error and error hook", async () => {
    const onError = mock(() => Promise.resolve());

    // Create a mock chatStore.get that throws an error
    (chatStore.get as Mock<any>).mockImplementationOnce(() => {
      throw new Error("Test error");
    });

    const agent = new Agent({
      name: "TestAgent",
      instructions: "You are a test agent",
      model: "gpt-4"
    }, {
      onError
    });

    const context = {
      chatId: "test-chat-id",
      userId: TEST_USER_1.id,
      organisationId: TEST_ORGANISATION_1.id
    };

    try {
      await agent.run("Hello agent", context);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toBe("Test error");
    }
    
    expect(onError).toHaveBeenCalled();
  });
}); 