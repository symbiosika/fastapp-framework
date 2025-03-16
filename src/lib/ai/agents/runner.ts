import { nanoid } from "nanoid";
import { Agent } from "./agent";
import { AgentExecution, AgentExecutionResult, InputGuardrail, OutputGuardrail } from "./types";
import { ChatMessage, ChatSessionContext, chatStore } from "../chat/chat-store";
import log from "../../../lib/log";

export interface RunConfig {
  inputGuardrails?: InputGuardrail[];
  outputGuardrails?: OutputGuardrail[];
  maxTurns?: number;
  traceId?: string;
}

export class Runner {
  /**
   * Run an agent with the given input and context
   */
  public static async run(
    agent: Agent,
    input: string | ChatMessage[],
    context: ChatSessionContext,
    config: RunConfig = {}
  ): Promise<AgentExecutionResult> {
    const { inputGuardrails = [], outputGuardrails = [], maxTurns = 10 } = config;
    
    log.logCustom({ name: context.chatId }, `Running agent ${agent.name}`);
    
    // Run the agent
    return await agent.run(input, context, inputGuardrails, outputGuardrails);
  }

  /**
   * Run an agent with streaming capabilities
   */
  public static async runStreamed(
    agent: Agent,
    input: string | ChatMessage[],
    context: ChatSessionContext,
    config: RunConfig = {}
  ): Promise<AgentExecutionResult> {
    // For now, this is just a wrapper around run
    // In a real implementation, this would handle streaming responses
    return await this.run(agent, input, context, config);
  }

  /**
   * Create a new execution context for an agent
   */
  public static createExecutionContext(
    userId: string,
    organisationId: string,
    chatSessionGroupId?: string
  ): ChatSessionContext {
    const chatId = nanoid(16);
    return {
      chatId,
      userId,
      organisationId,
      chatSessionGroupId
    };
  }

  /**
   * Store an agent execution in the chat store
   */
  public static async storeExecution(
    execution: AgentExecution
  ): Promise<void> {
    const { context, messages, variables } = execution;
    
    // Get or create chat session
    let chatSession = await chatStore.get(context.chatId);
    if (!chatSession) {
      chatSession = await chatStore.create({
        chatId: context.chatId,
        context: {
          userId: context.userId,
          organisationId: context.organisationId,
          chatSessionGroupId: context.chatSessionGroupId
        }
      });
    }
    
    // Update chat session with messages and variables
    await chatStore.set(context.chatId, { 
      messages: [...chatSession.messages, ...messages],
      state: {
        ...chatSession.state,
        variables: {
          ...chatSession.state.variables,
          ...variables
        },
        agentExecutions: {
          ...chatSession.state.agentExecutions,
          [execution.id]: execution
        }
      }
    });
  }
} 