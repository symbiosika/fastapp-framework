import { Agent } from "./agent";
import {
  type AgentConfig,
  type AgentExecution,
  type AgentExecutionResult,
  type AgentExecutionStatus,
} from "./types";
import {
  type ChatMessage,
  type ChatSessionContext,
  chatStore,
} from "../chat/chat-store";
import { Runner } from "./runner";
import { nanoid } from "nanoid";
import log from "../../../lib/log";

/**
 * Create a handoff configuration for an agent
 * @param agent The agent to hand off to
 * @param options Handoff configuration options
 * @returns An AgentConfig object configured for handoff
 */
export function handoff(
  agent: Agent,
  options: {
    name?: string;
    description?: string;
    onHandoff?: (
      context: ChatSessionContext,
      input: any
    ) => Promise<void> | void;
    inputType?: any;
  } = {}
): AgentConfig {
  return {
    name: options.name || `${agent.name}_handoff`,
    instructions: agent.instructions,
    model: agent.model,
    modelSettings: agent.modelSettings,
    tools: agent.tools,
    handoffs: agent.handoffs,
    outputType: agent.outputType,
  };
}

/**
 * Execute a handoff from one agent to another
 * @param fromExecution The current agent execution
 * @param toAgent The agent to hand off to
 * @param input Optional input to pass to the handoff agent
 * @returns The result of the handoff agent execution
 */
export async function executeHandoff(
  fromExecution: AgentExecution,
  toAgent: Agent,
  input?: string | ChatMessage[]
): Promise<AgentExecutionResult> {
  const { context } = fromExecution;

  log.logCustom(
    { name: context.chatId },
    `Executing handoff from ${fromExecution.agentId} to ${toAgent.name}`
  );

  // Create a new execution ID for the handoff
  const handoffExecutionId = nanoid(16);

  // Create a handoff execution record
  const handoffExecution: AgentExecution = {
    id: handoffExecutionId,
    agentId: toAgent.name,
    status: "pending",
    startTime: new Date().toISOString(),
    input: input || fromExecution.input,
    messages: [],
    context,
    variables: {},
    parentExecutionId: fromExecution.id,
  };

  // Update the parent execution to track this child
  fromExecution.childExecutions = [
    ...(fromExecution.childExecutions || []),
    handoffExecutionId,
  ];

  try {
    // Run the handoff agent
    const result = await Runner.run(toAgent, handoffExecution.input, context);

    // Update the handoff execution record
    handoffExecution.status = "completed";
    handoffExecution.endTime = new Date().toISOString();
    handoffExecution.output = result.output;
    handoffExecution.messages = result.messages;
    handoffExecution.variables = result.variables;

    // Store the handoff execution
    await Runner.storeExecution(handoffExecution);

    return result;
  } catch (error) {
    // Update the handoff execution record
    handoffExecution.status = "failed";
    handoffExecution.endTime = new Date().toISOString();
    handoffExecution.error =
      error instanceof Error ? error.message : String(error);

    // Store the handoff execution
    await Runner.storeExecution(handoffExecution);

    throw error;
  }
}

/**
 * Execute a workflow of multiple agents in sequence
 * @param agents Array of agents to execute in sequence
 * @param input Initial input to pass to the first agent
 * @param context Chat session context
 * @param options Configuration options for the workflow
 * @returns The result of the final agent execution
 */
export async function executeAgentWorkflow(
  agents: Agent[],
  input: string | ChatMessage[],
  context: ChatSessionContext,
  options: {
    passThroughOutput?: boolean;
    workflowName?: string;
    onAgentStart?: (agent: Agent, input: any) => Promise<void> | void;
    onAgentEnd?: (
      agent: Agent,
      result: AgentExecutionResult
    ) => Promise<void> | void;
  } = {}
): Promise<AgentExecutionResult> {
  if (agents.length === 0) {
    throw new Error("No agents provided for workflow execution");
  }

  const workflowId = nanoid(16);
  const workflowName = options.workflowName || "agent_workflow";

  log.logCustom(
    { name: context.chatId },
    `Starting agent workflow "${workflowName}" with ${agents.length} agents`
  );

  // Create a workflow execution record in variables
  const workflowExecution: {
    id: string;
    name: string;
    startTime: string;
    endTime?: string;
    error?: string;
    agentExecutions: Array<{
      agentName: string;
      executionId: string;
      status: string;
      startTime: string;
      endTime: string;
    }>;
    status: AgentExecutionStatus;
  } = {
    id: workflowId,
    name: workflowName,
    startTime: new Date().toISOString(),
    agentExecutions: [],
    status: "running",
  };

  // Initialize result with the input
  let currentInput = input;
  let finalResult: AgentExecutionResult | null = null;

  try {
    // Execute each agent in sequence
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const isLastAgent = i === agents.length - 1;

      log.logCustom(
        { name: context.chatId },
        `Executing agent ${i + 1}/${agents.length}: ${agent.name}`
      );

      // Call onAgentStart hook if available
      if (options.onAgentStart) {
        await options.onAgentStart(agent, currentInput);
      }

      // Run the agent
      const result = await Runner.run(agent, currentInput, context);

      // Store the result
      finalResult = result;

      // Add to workflow execution record
      workflowExecution.agentExecutions.push({
        agentName: agent.name,
        executionId: nanoid(10), // Generate a unique ID since result doesn't have executionId
        status: "completed",
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });

      // Call onAgentEnd hook if available
      if (options.onAgentEnd) {
        await options.onAgentEnd(agent, result);
      }

      // If this is not the last agent, prepare input for the next agent
      if (!isLastAgent) {
        if (options.passThroughOutput) {
          // Pass the output directly to the next agent
          currentInput = result.output;
        } else {
          // Create a message summarizing the result for the next agent
          currentInput = [
            {
              role: "system",
              content: `Previous agent (${agent.name}) result: ${JSON.stringify(result.output)}`,
              meta: {
                id: nanoid(10),
                timestamp: new Date().toISOString(),
              },
            },
          ];
        }
      }
    }

    // Update workflow status
    workflowExecution.status = "completed";
    workflowExecution.endTime = new Date().toISOString();

    // Store workflow execution in chat session
    const chatSession = await chatStore.get(context.chatId);
    if (chatSession) {
      await chatStore.set(context.chatId, {
        state: {
          ...chatSession.state,
          variables: {
            ...chatSession.state.variables,
            workflows: {
              ...((chatSession.state.variables.workflows as Record<
                string,
                any
              >) || {}),
              [workflowId]: workflowExecution,
            },
          },
        },
      });
    }

    return finalResult!;
  } catch (error) {
    // Update workflow status
    workflowExecution.status = "failed";
    workflowExecution.endTime = new Date().toISOString();
    workflowExecution.error =
      error instanceof Error ? error.message : String(error);

    // Store workflow execution in chat session
    const chatSession = await chatStore.get(context.chatId);
    if (chatSession) {
      await chatStore.set(context.chatId, {
        state: {
          ...chatSession.state,
          variables: {
            ...chatSession.state.variables,
            workflows: {
              ...((chatSession.state.variables.workflows as Record<
                string,
                any
              >) || {}),
              [workflowId]: workflowExecution,
            },
          },
        },
      });
    }

    throw error;
  }
}
