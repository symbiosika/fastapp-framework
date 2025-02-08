/**
 * A lib to control chat flows
 */
import * as v from "valibot";
import type { ChatMessage, ChatSession } from "./chat-store";
import { chatStore } from "./chat-store";
import { initAgentsSystemPrompt, initChatMessage } from "./get-prompt-template";
import type { ChatWithTemplateReturn } from "../../../types";
import { LLMAgent } from "../agents/llm-agent";
import { FlowEngine } from "../agents/flow";
import { createHeadlineFromChat } from "./generate-headline";
import type { Agent, AgentInputVariables } from "../../types/agents";
import { LLMOptions } from "../../db/db-schema";

const chatInitValidation = v.object({
  userId: v.string(),
  organisationId: v.string(),

  chatId: v.optional(v.string()),
  chatSessionGroupId: v.optional(v.string()),
  initiateTemplate: v.optional(
    v.object({
      promptId: v.optional(v.string()),
      promptName: v.optional(v.string()),
      promptCategory: v.optional(v.string()),
      organisationId: v.optional(v.string()),
    })
  ),
  trigger: v.optional(
    v.object({
      next: v.boolean(),
      skip: v.boolean(),
    })
  ),
  userMessage: v.optional(v.string()),
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
});
type ChatInitInput = v.InferOutput<typeof chatInitValidation>;

// Initialize available agents
const agents: Record<string, Agent> = {
  llmAgent: new LLMAgent(),
};
const flowEngine = new FlowEngine(agents);

/**
 * Initialize a chat session with an optionaltemplate
 * Will check if the chat already exists, and if not, will create a new one
 * If the user has given a promptName or promptId,
 * it will be used to initiate the chat with the template as system prompt
 */
const initChatSession = async (
  query: ChatInitInput
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
  // also if the session is empty, we need to create the initial messages etc.
  if (!session || !query.chatId || (session && session.messages.length === 0)) {
    // Init the Agent System Prompt
    const agentTemplate = await initAgentsSystemPrompt(
      query.userId,
      query.organisationId,
      query.initiateTemplate ?? {}
    );
    // set as message
    const initialMessage = initChatMessage(agentTemplate.template, "system");

    // merge the llmOptions from the user with the llmOptions from the template
    llmOptions = {
      ...(query.llmOptions ?? {}),
      ...(agentTemplate.llmOptions ?? {}),
    };

    let variables = {
      ...(query.variables ?? {}),
    };

    // replace the main user message
    if (query.variables?.user_input) {
      variables = { ...variables, userMessage: query.variables.user_input };
    }
    if (query.userMessage) {
      variables = { ...variables, userMessage: query.userMessage };
    }

    if (!session) {
      // create a new session in the db
      session = await chatStore.create({
        messages: [initialMessage],
        variables,
        context: {
          userId: query.userId,
          organisationId: query.organisationId,
          chatSessionGroupId: query.chatSessionGroupId,
        },
      });
      isNewSession = true;
    } else {
      // update the session in the db for existing but empty sessions
      session = await chatStore.set(session.id, {
        messages: [initialMessage],
        state: {
          ...session.state,
          variables,
        },
      });
    }
  }
  // update the session in the db for existing sessions and is not empty
  else {
    session = await chatStore.set(session.id, {
      state: {
        ...session.state,
        variables: {
          ...session.state.variables,
          ...(query.variables ?? {}),
        },
      },
    });
  }

  return { session, isNewSession, llmOptions };
};

// Keep existing chatWithAgent function, but internally use LLMAgent
export const chatWithAgent = async (query: unknown) => {
  const parsedQuery = v.parse(chatInitValidation, query);

  // Initialize session as before
  const { session, isNewSession, llmOptions } =
    await initChatSession(parsedQuery);

  // Determine the current user input from the session state
  const newUserInput = session.state.variables["userMessage"] ?? "";

  // Create a shallow copy of the current chat messages
  let messages = [...session.messages];

  // Use the LLMAgent directly, passing the full chat history
  const llmAgent = agents.llmAgent;
  const result = await llmAgent.run(
    {
      userId: parsedQuery.userId,
      organisationId: parsedQuery.organisationId,
      chatSessionGroupId: parsedQuery.chatSessionGroupId,
    },
    {
      user_input: newUserInput,
      messages,
      ...(parsedQuery.variables ?? {}),
    } as unknown as AgentInputVariables,
    llmOptions
  );

  // Convert agent output to chat message
  const resultMessage = initChatMessage(result.outputs.default, "assistant");

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
    state: session.state,
  });

  return <ChatWithTemplateReturn>{
    chatId: session.id,
    message: resultMessage,
    meta: {
      userId: parsedQuery.userId,
      organisationId: parsedQuery.organisationId,
      chatSessionGroupId: parsedQuery.chatSessionGroupId,
    },
    finished: true,
    llmOptions: parsedQuery.llmOptions,
    render: {
      type: "markdown",
    },
  };
};

/**
 * Create an empty chat session
 */
export const createEmptySession = async (input: {
  userId: string;
  organisationId: string;
  chatId?: string;
  chatSessionGroupId?: string;
}): Promise<{ chatId: string }> => {
  if (input.chatId) {
    const exists = await chatStore.checkIfSessionExists(input.chatId);
    if (exists) {
      return { chatId: input.chatId };
    }
  }

  const session = await chatStore.create({
    chatId: input.chatId,
    messages: [],
    variables: {},
    context: {
      userId: input.userId,
      organisationId: input.organisationId,
      chatSessionGroupId: input.chatSessionGroupId,
    },
  });

  return { chatId: session.id };
};
