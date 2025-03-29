import * as v from "valibot";
import { nanoid } from "nanoid";
import { ChatMessage, chatStore, ChatSession } from "../../ai/chat-store";
import { chatCompletion } from "../../ai/ai-sdk";
import { initTemplateMessage } from "../../ai/prompt-templates/init-message";
import log from "../../log";
import { checkAndRegisterDynamicTool } from "./register-dynamic-tool";

export const chatInputValidation = v.object({
  chatId: v.optional(v.string()),
  context: v.optional(
    v.object({
      chatSessionGroupId: v.optional(v.string()),
    })
  ),
  useTemplate: v.optional(v.string()),
  variables: v.optional(v.record(v.string(), v.string())),
  options: v.optional(
    v.object({
      model: v.optional(v.string()), // "<provider>:<model>"
      maxTokens: v.optional(v.number()),
      temperature: v.optional(v.number()),
    })
  ),
  enabledTools: v.optional(v.array(v.string())),
  input: v.union([v.string(), v.record(v.string(), v.string())]),
});

export type ChatInput = v.InferOutput<typeof chatInputValidation>;
export type ChatInputValidation = ChatInput & {
  context: {
    organisationId: string;
    userId: string;
  };
};

export type ChatWithTemplateReturn = {
  chatId: string;
  message: ChatMessage;
  messages: ChatMessage[];
};

// Default system message when no template is specified
const DEFAULT_SYSTEM_MESSAGE =
  "You are a helpful AI assistant that provides accurate and helpful information.";

/**
 * Main chat function to handle chat interactions with AI
 */
export async function chat(
  options: ChatInputValidation
): Promise<ChatWithTemplateReturn> {
  try {
    // 1. Normalize input
    let userInput: Record<string, string>;
    if (typeof options.input === "string") {
      userInput = { user_input: options.input };
    } else {
      userInput = options.input;
    }

    // 2. Get or create chat session
    let session: ChatSession;
    const chatId = options.chatId || nanoid(16);

    if (options.chatId) {
      const existingSession = await chatStore.get(options.chatId);
      if (existingSession) {
        session = existingSession;
      } else {
        session = await chatStore.create({
          chatId,
          context: {
            userId: options.context.userId,
            organisationId: options.context.organisationId,
          },
          variables: userInput,
        });
      }
    } else {
      session = await chatStore.create({
        chatId,
        context: {
          userId: options.context.userId,
          organisationId: options.context.organisationId,
        },
        variables: userInput,
      });
    }

    // 3. Use the central tools registry and preparation function
    const enabledToolNames = options.enabledTools || [];

    // 4. Handle initial templates or messages
    let messages: ChatMessage[] = [...session.messages];
    const isFirstInteraction = messages.length === 0;

    if (isFirstInteraction) {
      // Use template if specified, otherwise use default
      if (options.useTemplate) {
        const {
          systemPrompt,
          userPrompt,
          knowledgeEntries,
          knowledgeFilters,
          knowledgeGroups,
        } = await initTemplateMessage({
          organisationId: options.context.organisationId,
          template: options.useTemplate, // "<category>:<name>" or "00000000-0000-0000-0000-000000000000"
          userInput,
        });

        // Check and register the dynamic knowledge base tool
        const dynamicKnowledgeBaseTool = await checkAndRegisterDynamicTool({
          knowledgeEntries,
          knowledgeFilters,
          knowledgeGroups,
        });
        if (dynamicKnowledgeBaseTool) {
          enabledToolNames.push(dynamicKnowledgeBaseTool.name);
        }

        // Add system message
        messages.push({
          role: "system",
          content: systemPrompt,
          meta: {
            id: nanoid(10),
            timestamp: new Date().toISOString(),
          },
        });

        // Add user message
        messages.push({
          role: "user",
          content: userPrompt,
          meta: {
            id: nanoid(10),
            human: true,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        // Add default system message
        messages.push({
          role: "system",
          content: DEFAULT_SYSTEM_MESSAGE,
          meta: {
            id: nanoid(10),
            timestamp: new Date().toISOString(),
          },
        });

        // Add user message
        messages.push({
          role: "user",
          content: userInput.user_input,
          meta: {
            id: nanoid(10),
            human: true,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } else {
      // Just add the new user message for continuing conversations
      messages.push({
        role: "user",
        content: userInput.user_input,
        meta: {
          id: nanoid(10),
          human: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 5. Convert messages to format expected by AI SDK
    const coreMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 6. Generate response using AI SDK
    const response = await chatCompletion(
      coreMessages,
      {
        userId: options.context.userId,
        organisationId: options.context.organisationId,
      },
      {
        providerAndModelName: options.options?.model, // "<provider>:<model>"
        maxTokens: options.options?.maxTokens,
        temperature: options.options?.temperature,
        tools: enabledToolNames,
      }
    );

    // 7. Add assistant response to messages
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: response.text,
      meta: {
        id: response.id || nanoid(10),
        model: response.model,
        timestamp: new Date().toISOString(),
        ...response.meta,
      },
    };

    messages.push(assistantMessage);

    // 8. Update chat session in store
    await chatStore.set(chatId, {
      messages,
      updatedAt: new Date().toISOString(),
    });

    // 9. Return response
    return {
      chatId,
      message: assistantMessage,
      messages,
    };
  } catch (error) {
    log.error(`Error in chat(): ${error}`);
    throw error;
  }
}
