import * as v from "valibot";
import { nanoid } from "nanoid";
import {
  type ChatMessage,
  chatStore,
  type ChatSession,
} from "../../ai/chat-store";
import { chatCompletion, type SourceReturn } from "../../ai/ai-sdk";
import { initTemplateMessage } from "../../ai/prompt-templates/init-message";
import log from "../../log";
import { checkAndRegisterDynamicRAGTool } from "./register-dynamic-tool";
import { replaceCustomPlaceholders } from "../custom-replacer/replacer";
import { customAppPlaceholders } from "../custom-replacer/custom-placeholders";
import type { CoreMessage } from "ai";
import { DEFAULT_SYSTEM_MESSAGE } from "../prompt-templates/default-prompt";
import { createHeadlineFromChat } from "../headline";
import { getDynamicToolMemory } from "./tools";

export const chatInputValidation = v.object({
  chatId: v.optional(v.string()),
  context: v.optional(
    v.object({
      chatSessionGroupId: v.optional(v.string()),
    })
  ),
  useTemplate: v.optional(v.string()),
  useTemplatePlaceholders: v.optional(v.boolean()),
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

/**
 * Main chat function to handle chat interactions with AI
 */
export async function chat(
  options: ChatInputValidation
): Promise<ChatWithTemplateReturn> {
  try {
    let isNewChat = true;

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
        isNewChat = false;
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
      isNewChat = true;
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

    let dynamicKnowledgeBaseToolName: string | undefined;
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
        const dynamicKnowledgeBaseTool = await checkAndRegisterDynamicRAGTool(
          {
            knowledgeEntries,
            knowledgeFilters,
            knowledgeGroups,
          },
          {
            userId: options.context.userId,
            organisationId: options.context.organisationId,
          }
        );
        if (dynamicKnowledgeBaseTool) {
          // set state
          dynamicKnowledgeBaseToolName = dynamicKnowledgeBaseTool.name;
          // enable tool
          enabledToolNames.push(dynamicKnowledgeBaseToolName);
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
    let coreMessages: CoreMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 6. Replace custom placeholders if specified
    let replacedMessagesSources: SourceReturn[] = [];
    if (options.useTemplatePlaceholders ?? true) {
      const { replacedMessages, addToMeta } = await replaceCustomPlaceholders(
        coreMessages,
        customAppPlaceholders,
        userInput,
        {
          userId: options.context.userId,
          organisationId: options.context.organisationId,
          chatId,
        }
      );
      coreMessages = replacedMessages;
      replacedMessagesSources = addToMeta?.sources || [];
    }

    // 7. Generate response using AI SDK
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

    // attach custom placeholders sources to the response if needed
    response.meta.sources.push(...replacedMessagesSources);

    // 8. Add assistant response to messages
    // check if the dynamic tool was used
    const dynamicToolWasUsed = dynamicKnowledgeBaseToolName
      ? response.meta.toolsUsed?.includes(dynamicKnowledgeBaseToolName)
      : false;

    if (dynamicToolWasUsed) {
      let sources: SourceReturn[] = [];
      if (dynamicKnowledgeBaseToolName) {
        sources =
          getDynamicToolMemory(dynamicKnowledgeBaseToolName)?.usedSources || [];
      }
      response.meta.sources.push(...sources);
    }

    // drop all duplicate sources by id
    response.meta.sources = response.meta.sources.filter(
      (source, index, self) =>
        index === self.findIndex((t) => t.id === source.id)
    );

    // build message to be stored and returned
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: response.text,
      meta: {
        id: response.id || nanoid(10),
        model: response.model,
        timestamp: new Date().toISOString(),
        ...response.meta,
        knowledgeSources: dynamicToolWasUsed
          ? {
              knowledgeEntries: [],
              knowledgeFilters: [],
            }
          : undefined,
      },
    };

    messages.push(assistantMessage);

    let name: string | undefined;
    if (isNewChat) {
      // create headline
      const headline = await createHeadlineFromChat(coreMessages, {
        userId: options.context.userId,
        organisationId: options.context.organisationId,
      });
      name = headline.headline;
    }

    // 9. Update chat session in store
    await chatStore.set(chatId, {
      messages,
      updatedAt: new Date().toISOString(),
      name,
    });

    // 10. Return response
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
