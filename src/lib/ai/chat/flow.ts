/**
 * A lib to control complex agent flows
 */
import * as v from "valibot";
import { ChatSession, chatStore } from "./chat-store";
import { initChatMessage } from "./get-prompt-template";
import { createHeadlineFromChat } from "./generate-headline";
import { AgentFactory } from "../agents/agent-factory";
import { AgentInputVariables, FlowExecution } from "../agents/types";
import { LLMOptions } from "../../../dbSchema";
import log from "../../../lib/log";

export const flowInputValidation = v.object({
  chatId: v.optional(v.string()),
  chatSessionGroupId: v.optional(v.string()),
  goal: v.string(),
  agents: v.optional(v.array(v.string())),
  variables: v.optional(
    v.record(v.string(), v.union([v.string(), v.number(), v.boolean()]))
  ),
  llmOptions: v.optional(
    v.object({
      model: v.optional(v.string()),
      maxTokens: v.optional(v.number()),
      temperature: v.optional(v.number()),
    })
  ),
  maxSteps: v.optional(v.number()),
});

export const flowInputValidationWithContext = v.intersect([
  v.object({
    context: v.object({
      userId: v.string(),
      organisationId: v.string(),
    }),
  }),
  flowInputValidation,
]);

type FlowInputWithContext = v.InferOutput<
  typeof flowInputValidationWithContext
>;

export const flowReturnValidation = v.object({
  chatId: v.string(),
  message: v.object({
    role: v.union([
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
      v.literal("developer"),
    ]),
    content: v.optional(v.string()),
    artifacts: v.optional(v.record(v.string(), v.any())),
  }),
  meta: v.any(),
  finished: v.optional(v.boolean()),
  plan: v.optional(v.any()),
  render: v.optional(
    v.union([
      v.object({
        type: v.literal("text"),
      }),
      v.object({
        type: v.literal("markdown"),
      }),
      v.object({
        type: v.literal("flow"),
        plan: v.any(),
      }),
    ])
  ),
});

type FlowReturn = v.InferOutput<typeof flowReturnValidation>;

/**
 * Initialize a flow session
 * Will check if the chat already exists, and if not, will create a new one
 */
const initFlowSession = async (
  query: FlowInputWithContext
): Promise<{
  session: ChatSession;
  isNewSession: boolean;
  llmOptions: LLMOptions;
}> => {
  let session: ChatSession | null = null;
  let isNewSession = false;
  let llmOptions: LLMOptions = {};

  // if a chatId is provided -> try get the chat
  if (query.chatId) {
    session = await chatStore.get(query.chatId);
  }

  // if the session was not found or the chatId is not provided -> create a new chat
  if (!session || !query.chatId) {
    isNewSession = true;

    // Init the Agent System Prompt
    const systemPrompt = `You are an AI agent orchestrator that can plan and execute complex tasks.
You will be given a user request, and your job is to break it down into steps, then execute each step.
You can use various tools and agents to accomplish the task.

Goal: ${query.goal}`;

    // set as message with meta information
    const messages = [
      initChatMessage(systemPrompt, "system", {
        human: false,
        timestamp: new Date().toISOString(),
      }),
      initChatMessage(query.goal, "user", {
        human: true,
        timestamp: new Date().toISOString(),
      }),
    ];

    // merge the llmOptions from the user
    llmOptions = {
      ...(query.llmOptions ?? {}),
    };

    let variables = {
      ...(query.variables ?? {}),
      user_input: query.goal,
    };

    // create a new session in the db
    session = await chatStore.create({
      chatId: query.chatId,
      messages,
      variables,
      context: {
        userId: query.context.userId,
        organisationId: query.context.organisationId,
        chatSessionGroupId: query.chatSessionGroupId,
      },
    });
  } else {
    // update the session in the db for existing sessions
    llmOptions = {
      ...(query.llmOptions ?? {}),
    };

    session = await chatStore.set(session.id, {
      state: {
        ...session.state,
        variables: {
          ...session.state.variables,
          ...(query.variables ?? {}),
          user_input: query.goal,
        },
      },
    });
  }

  return { session, isNewSession, llmOptions };
};

/**
 * Execute a complex agent flow
 */
export const executeFlow = async (query: unknown): Promise<FlowReturn> => {
  const parsedQuery = v.parse(flowInputValidationWithContext, query);

  // Initialize the flow session
  const { session, isNewSession, llmOptions } =
    await initFlowSession(parsedQuery);

  // Create a shallow copy of the current chat messages
  let messages = [...session.messages];

  // Create a flow agent
  const flowAgent = AgentFactory.createFlowAgent(
    {},
    {
      maxSteps: parsedQuery.maxSteps || 10,
    }
  );

  // Add the specified agents to the flow
  if (parsedQuery.agents && Array.isArray(parsedQuery.agents)) {
    const agentMap: Record<string, any> = {};
    for (const agentId of parsedQuery.agents) {
      const agent = AgentFactory.createAgentById(agentId);
      if (agent) {
        agentMap[agentId] = agent;
      }
    }
    flowAgent.agents = agentMap;
    flowAgent.executorKeys = Object.keys(agentMap);
  }

  // Execute the flow agent
  const result = (await flowAgent.run(
    {
      chatId: session.id,
      userId: parsedQuery.context.userId,
      organisationId: parsedQuery.context.organisationId,
      chatSessionGroupId: parsedQuery.chatSessionGroupId,
    },
    messages,
    {
      user_input: parsedQuery.goal,
      ...(parsedQuery.variables ?? {}),
    } as unknown as AgentInputVariables,
    llmOptions
  )) as FlowExecution;

  // Convert agent output to chat message with meta information
  const resultMessage = initChatMessage(result.outputs.default, "assistant", {
    human: false,
    model: result.metadata?.model ? result.metadata.model + "" : "unknown",
    timestamp: new Date().toISOString(),
    ...result.metadata,
  });

  // Add the assistant's response to the messages array
  messages.push(resultMessage);

  // Create headline for new sessions
  if (isNewSession) {
    session.name = await createHeadlineFromChat(messages);
  }

  // Save to chat store with the updated messages and state
  await chatStore.set(session.id, {
    messages,
    name: session.name,
    state: {
      ...session.state,
      lastUsedAgentId: "flow-agent",
      agentExecutions: {
        ...session.state.agentExecutions,
        [result.id]: result,
      },
    },
  });

  return {
    chatId: session.id,
    message: {
      role: resultMessage.role,
      content: resultMessage.content || "",
      artifacts: resultMessage.artifacts,
    },
    meta: {
      userId: parsedQuery.context.userId,
      organisationId: parsedQuery.context.organisationId,
      chatSessionGroupId: parsedQuery.chatSessionGroupId,
    },
    finished: true,
    plan: result.plan,
    render: {
      type: "flow",
      plan: result.plan,
    },
  };
};
