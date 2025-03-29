/**
 * A lib to control chat flows
 */
import * as v from "valibot";
import type { ChatSession } from "./chat-store";
import { chatStore } from "./chat-store";
import { initAgentsSystemPrompt, initChatMessage } from "./get-prompt-template";
import { LLMAgent } from "../agents-OLD/llm-agent";
import { createHeadlineFromChat } from "./generate-headline";
import type { Agent, AgentInputVariables } from "../../types/agents";
import type { LLMOptions } from "../../db/db-schema";

export const chatInitInputValidation = v.object({
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

export const chatInitValidation = v.intersect([
  v.object({
    userId: v.string(),
    organisationId: v.string(),
  }),
  chatInitInputValidation,
]);
type ChatInitInput = v.InferOutput<typeof chatInitValidation>;

export const chatInputValidation = v.object({
  chatId: v.optional(v.string()),
  context: v.optional(
    v.object({
      chatSessionGroupId: v.optional(v.string()),
    })
  ),
  startWithAssistant: v.optional(
    v.object({
      id: v.optional(v.string()),
      name: v.optional(v.string()),
      category: v.optional(v.string()),
    })
  ),
  variables: v.optional(
    v.record(v.string(), v.union([v.string(), v.number(), v.boolean()]))
  ),
  options: v.optional(
    v.object({
      model: v.optional(v.string()),
      maxTokens: v.optional(v.number()),
      temperature: v.optional(v.number()),
    })
  ),
});

export const chatWithTemplateReturnValidation = v.object({
  chatId: v.string(),
  message: v.object({
    role: v.union([v.literal("user"), v.literal("assistant")]),
    content: v.string(),
  }),
  meta: v.any(),
  finished: v.optional(v.boolean()),
  render: v.optional(
    v.union([
      v.object({
        type: v.literal("text"),
      }),
      v.object({
        type: v.literal("image"),
        url: v.string(),
      }),
      v.object({
        type: v.literal("box"),
        severity: v.union([
          v.literal("info"),
          v.literal("warning"),
          v.literal("error"),
        ]),
      }),
      v.object({
        type: v.literal("markdown"),
      }),
      v.object({
        type: v.literal("form"),
        definition: v.array(v.any()), // GenericFormEntry[] type
        data: v.record(v.string(), v.any()),
      }),
    ])
  ),
});
type ChatWithTemplateReturn = v.InferOutput<
  typeof chatWithTemplateReturnValidation
>;

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
  includesUserPrompt: boolean;
}> => {
  let session: ChatSession | null = null;
  let isNewSession = false;
  let includesUserPrompt = false;
  let llmOptions: LLMOptions = {};

  // if a chatId is provided -> try get the chat
  if (query.chatId) {
    session = await chatStore.get(query.chatId);
  }

  // if the session was not found or the chatId is not provided -> create a new chat
  // also if the session is empty, we need to create the initial messages etc.
  if (!session || !query.chatId || (session && session.messages.length === 0)) {
    isNewSession = true;

    // Init the Agent System Prompt
    const agentTemplate = await initAgentsSystemPrompt(
      query.userId,
      query.organisationId,
      query.initiateTemplate ?? {}
    );
    // set as message with meta information
    const messages = [
      initChatMessage(agentTemplate.systemPrompt, "system", {
        human: false,
        timestamp: new Date().toISOString(),
      }),
    ];

    // check if a users prompt is provided
    if (agentTemplate.userPrompt && agentTemplate.userPrompt !== "") {
      includesUserPrompt = true;
      messages.push(
        initChatMessage(agentTemplate.userPrompt, "user", {
          human: true,
          timestamp: new Date().toISOString(),
        })
      );
    }

    // merge the llmOptions from the user with the llmOptions from the template
    llmOptions = {
      ...(query.llmOptions ?? {}),
      ...(agentTemplate.llmOptions ?? {}),
    };

    let variables = {
      ...(query.variables ?? {}),
    };

    if (!session) {
      // create a new session in the db
      session = await chatStore.create({
        chatId: query.chatId,
        messages,
        variables,
        context: {
          userId: query.userId,
          organisationId: query.organisationId,
          chatSessionGroupId: query.chatSessionGroupId,
        },
      });
    } else {
      // update the session in the db for existing but empty sessions
      session = await chatStore.set(session.id, {
        messages,
        state: {
          ...session.state,
          variables,
        },
      });
    }
  }
  // update the session in the db for existing sessions and is not empty
  else {
    llmOptions = {
      ...(query.llmOptions ?? {}),
    };

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

  return { session, isNewSession, llmOptions, includesUserPrompt };
};

// Keep existing chatWithAgent function, but internally use LLMAgent
export const chatWithAgent = async (query: unknown) => {
  const parsedQuery = v.parse(chatInitValidation, query);

  // Initialize session as before
  const { session, isNewSession, llmOptions, includesUserPrompt } =
    await initChatSession(parsedQuery);

  // Create a shallow copy of the current chat messages
  let messages = [...session.messages];

  // Use the LLMAgent directly, passing the full chat history
  const llmAgent = new LLMAgent();
  const result = await llmAgent.run(
    {
      chatId: session.id,
      userId: parsedQuery.userId,
      organisationId: parsedQuery.organisationId,
      chatSessionGroupId: parsedQuery.chatSessionGroupId,
    },
    {
      user_input: session.state.variables["user_input"] ?? "",
      messages,
      messagesIncludeUserPrompt: includesUserPrompt,
      ...(parsedQuery.variables ?? {}),
    } as unknown as AgentInputVariables,
    llmOptions
  );

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
    session.name = await createHeadlineFromChat(messages, {
      organisationId: parsedQuery.organisationId,
      userId: parsedQuery.userId,
    });
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
