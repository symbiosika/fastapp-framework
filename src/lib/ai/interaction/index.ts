import * as v from "valibot";
import { nanoid } from "nanoid";
import {
  type ChatMessage,
  chatStore,
  type ChatSession,
} from "../../ai/chat-store";
import { chatCompletion } from "../../ai/ai-sdk";
import type { SourceReturn } from "../../ai/ai-sdk/types";
import { initTemplateMessage } from "../../ai/prompt-templates/init-message";
import log from "../../log";
import { checkAndRegisterDynamicTool } from "./register-dynamic-tools";
import { replaceCustomPlaceholders } from "../custom-replacer/replacer";
import { customAppPlaceholders } from "../custom-replacer/custom-placeholders";
import type { CoreMessage } from "ai";
import { DEFAULT_SYSTEM_MESSAGE } from "../prompt-templates/default-prompt";
import { createHeadlineFromChat } from "../headline";
import { getAvatarForChat } from "../avatars";

export const chatInputValidation = v.object({
  chatId: v.optional(v.string()),
  context: v.optional(
    v.object({
      chatSessionGroupId: v.optional(v.string()),
    })
  ),
  useTemplate: v.optional(v.string()),
  useTemplatePlaceholders: v.optional(v.boolean()),
  useAvatar: v.optional(v.string()),
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

    // 1. Normalize input. Set user_input as default key
    let userInput: Record<string, string>;
    if (typeof options.input === "string") {
      userInput = { user_input: options.input };
    } else {
      userInput = options.input;
    }

    // 2. Get or create chat session
    let session: ChatSession | null = null;
    const chatId = options.chatId || nanoid(16);

    if (options.chatId) {
      session = await chatStore.get(options.chatId); // check if chat exists. can be NULL
    }
    if (session) {
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
    if (isNewChat) {
      log.info("start new chat", chatId);
    }

    // 3. Get the enabled tools from query or set to default
    const enabledToolNames = options.enabledTools || [];

    // 4. Handle initial templates or messages
    let messages: ChatMessage[] = [...session.messages];

    if (isNewChat) {
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

        // Check if a dynamic knowledge base tool is needed and register it
        const dynamicKnowledgeBaseTool = await checkAndRegisterDynamicTool(
          {
            knowledgeEntries,
            knowledgeFilters,
            knowledgeGroups,
          },
          "rag",
          {
            chatId,
            userId: options.context.userId,
            organisationId: options.context.organisationId,
          }
        );

        // Add the first (system) message
        messages.push({
          role: "system",
          content: systemPrompt,
          meta: {
            id: nanoid(10),
            timestamp: new Date().toISOString(),
          },
        });

        // Add Avatar message if specified
        if (options.useAvatar) {
          const avatarMessage = await getAvatarForChat(
            options.context.userId,
            options.context.organisationId,
            options.useAvatar
          );
          messages.push(avatarMessage);
          log.info("activated avatar " + options.useAvatar);
        }

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
      }
      // New Chat but no template was used
      else {
        // Add default system message
        messages.push({
          role: "system",
          content: DEFAULT_SYSTEM_MESSAGE,
          meta: {
            id: nanoid(10),
            timestamp: new Date().toISOString(),
          },
        });

        // Add Avatar message if specified
        if (options.useAvatar) {
          const avatarMessage = await getAvatarForChat(
            options.context.userId,
            options.context.organisationId,
            options.useAvatar
          );
          messages.push(avatarMessage);
          log.info("activated avatar " + options.useAvatar);
        }

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
    }
    // Not a new chat. Only add the new user message for continuing conversations
    else {
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
    let sourcesFromCustomPlaceholders: SourceReturn[] = [];
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
      sourcesFromCustomPlaceholders = addToMeta?.sources || [];
    }

    // 7. Generate response using AI SDK
    const response = await chatCompletion(
      coreMessages,
      {
        userId: options.context.userId,
        organisationId: options.context.organisationId,
        chatId,
      },
      {
        providerAndModelName: options.options?.model, // "<provider>:<model>"
        maxTokens: options.options?.maxTokens,
        temperature: options.options?.temperature,
        tools: enabledToolNames,
      }
    );

    // attach custom placeholders sources to the response if needed
    response.meta.sources.push(...sourcesFromCustomPlaceholders);

    // build message to be stored and returned
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

    let chatName: string | undefined;
    if (isNewChat) {
      // create headline
      const headline = await createHeadlineFromChat(coreMessages, {
        userId: options.context.userId,
        organisationId: options.context.organisationId,
      });
      chatName = headline.headline;
    }

    // 9. Update chat session in store
    await chatStore.set(chatId, {
      messages,
      updatedAt: new Date().toISOString(),
      name: chatName,
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
