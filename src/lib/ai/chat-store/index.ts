import { and, desc, eq, gte, lte } from "drizzle-orm";
import {
  chatSessionGroups,
  chatSessions,
  type ChatSessionsSelect,
} from "../../../lib/db/db-schema";
import { getDb } from "../../../lib/db/db-connection";
import log from "../../../lib/log";
import { nanoid } from "nanoid";
import type { ArtifactReturn } from "../ai-sdk/types";

export type NewChatSessionContext = {
  userId: string;
  organisationId: string;
  chatSessionGroupId?: string;
};

export type ChatSessionContext = NewChatSessionContext & {
  chatId: string;
};

export type ChatMessageRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatMessageRole;
  content?: string | any;
  meta?: {
    id: string;
    visible?: boolean;
    model?: string;
    human?: boolean;
    timestamp?: string;
    artifacts?: ArtifactReturn[];
    knowledgeSources?: {
      knowledgeEntries?: string[];
      knowledgeFilters?: string[];
    };
  };
};

export type ChatStoreState = {};

export type ChatSession = ChatSessionsSelect & {
  state: ChatStoreState;
  messages: ChatMessage[];
};

/**
 * Chat Store
 */
class ChatHistoryStoreInDb {
  constructor(public maxAgeHours: number = 48) {
    setInterval(() => this.cleanup(), 1000 * 60 * 60);
  }

  getDeleteAt(): string | null {
    return this.maxAgeHours
      ? new Date(Date.now() + this.maxAgeHours * 60 * 60 * 1000).toISOString()
      : null;
  }

  async create(options: {
    chatId?: string;
    variables?: any;
    context: NewChatSessionContext;
    messages?: ChatMessage[];
  }): Promise<ChatSession> {
    const chatId = options?.chatId || nanoid(16);
    options?.chatId &&
      log.logCustom({ name: chatId }, `Create chat session ${chatId}`);

    const session = await getDb()
      .insert(chatSessions)
      .values({
        id: chatId,
        name: `Chat ${chatId}`,
        userId: options.context.userId,
        organisationId: options.context.organisationId,
        messages: options.messages || [],
        state: {
          variables: options.variables || {},
        },
        deleteAt: this.getDeleteAt(),
        chatSessionGroupId: options.context.chatSessionGroupId,
      })
      .returning();

    return session[0] as ChatSession;
  }

  async checkIfSessionExists(chatId: string): Promise<boolean> {
    const session = await getDb()
      .select({
        id: chatSessions.id,
      })
      .from(chatSessions)
      .where(eq(chatSessions.id, chatId));
    return session.length > 0;
  }

  async get(chatId: string): Promise<ChatSession | null> {
    try {
      // update and get the last used at date
      const [updatedSession] = await getDb()
        .update(chatSessions)
        .set({ lastUsedAt: new Date().toISOString() })
        .where(eq(chatSessions.id, chatId))
        .returning();

      if (!updatedSession) return null;

      return updatedSession as ChatSession;
    } catch (error) {
      log.error(`Error getting chat session ${chatId}`, error + "");
      return null;
    }
  }

  async drop(chatId: string): Promise<void> {
    await getDb().delete(chatSessions).where(eq(chatSessions.id, chatId));
  }

  async set(
    chatId: string,
    session: Partial<ChatSession>
  ): Promise<ChatSession> {
    try {
      log.logCustom({ name: chatId }, `Update chat session ${chatId}`);

      // If organisationId is being updated, verify it matches the existing session
      if (session.organisationId) {
        const existingSession = await this.get(chatId);
        if (!existingSession) {
          throw new Error(`Chat session ${chatId} not found`);
        }

        if (existingSession.organisationId !== session.organisationId) {
          log.error(
            `Security violation: Attempted to change organisationId for chat session ${chatId} from ${existingSession.organisationId} to ${session.organisationId}`
          );
          throw new Error(
            "Cannot change organisation ID for an existing chat session"
          );
        }
      }

      const [updatedSession] = await getDb()
        .update(chatSessions)
        .set(session)
        .where(eq(chatSessions.id, chatId))
        .returning();

      return updatedSession as ChatSession;
    } catch (error) {
      log.error(`Error updating chat session ${chatId}`, error + "");
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    log.debug(`Cleanup chat sessions`);
    const cutoffDate = new Date(Date.now() - this.maxAgeHours * 60 * 60 * 1000);
    await getDb()
      .delete(chatSessions)
      .where(lte(chatSessions.updatedAt, cutoffDate.toISOString()));
  }

  async getHistoryByUserId(
    userId: string,
    startFrom: string,
    meta: { organisationId: string }
  ): Promise<ChatSession[]> {
    const result = await getDb()
      .select({
        id: chatSessions.id,
        name: chatSessions.name,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
        lastUsedAt: chatSessions.lastUsedAt,
      })
      .from(chatSessions)

      .where(
        and(
          eq(chatSessions.userId, userId),
          eq(chatSessions.organisationId, meta.organisationId),
          gte(chatSessions.updatedAt, startFrom)
        )
      )
      .orderBy(desc(chatSessions.updatedAt));
    return result as ChatSession[];
  }

  async getChatHistory(chatId: string): Promise<ChatMessage[]> {
    log.logCustom({ name: chatId }, `Get chat history for chat ${chatId}`);
    const session = await this.get(chatId);
    if (!session) throw new Error(`Chat session ${chatId} not found`);
    return session.messages as ChatMessage[];
  }

  async getParentWorkspaceByChatGroupId(
    chatGroupId: string | null
  ): Promise<{ workspaceId: string | null }> {
    if (!chatGroupId) return { workspaceId: null };
    const chatSessionGroup = await getDb()
      .select({
        workspaceId: chatSessionGroups.workspaceId,
      })
      .from(chatSessionGroups)
      .where(eq(chatSessionGroups.id, chatGroupId))
      .limit(1);
    return chatSessionGroup[0] ?? { workspaceId: null };
  }

  async updateChatMessage(
    chatId: string,
    messageId: string,
    newContent: Partial<ChatMessage>,
    organisationId?: string
  ): Promise<void> {
    log.logCustom(
      { name: chatId },
      `Update message ${messageId} in chat session ${chatId}`
    );

    const session = await this.get(chatId);
    if (!session) throw new Error(`Chat session ${chatId} not found`);

    // If organisationId is provided, verify it matches the session's organisationId
    if (organisationId && session.organisationId !== organisationId) {
      log.error(
        `Security violation: Attempted to update message in chat session ${chatId} with mismatched organisationId`
      );
      throw new Error(
        "Cannot update message in a chat session from a different organisation"
      );
    }

    const messageIndex = session.messages.findIndex(
      (msg) => msg.meta?.id === messageId
    );
    if (messageIndex === -1 || session.messages[messageIndex].role === "system")
      throw new Error(`Message ${messageId} not found or is a system message`);

    // merge the message content to the existing message
    const updatedMessage = { ...session.messages[messageIndex], ...newContent };
    session.messages[messageIndex] = updatedMessage;

    // Update the session in the database
    await getDb()
      .update(chatSessions)
      .set({
        messages: session.messages,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chatSessions.id, chatId));

    return;
  }
}

export const chatStore = new ChatHistoryStoreInDb(48);
