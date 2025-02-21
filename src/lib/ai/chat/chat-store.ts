import { and, desc, eq, gte, lte } from "drizzle-orm";
import {
  chatSessions,
  type ChatSessionsSelect,
} from "../../../lib/db/db-schema";
import { getDb } from "../../../lib/db/db-connection";
import log from "../../../lib/log";
import { nanoid } from "nanoid";

export type ChatSessionContext = {
  chatId: string;
  userId: string;
  organisationId: string;
  chatSessionGroupId?: string;
};

export type NewChatSessionContext = {
  userId: string;
  organisationId: string;
  chatSessionGroupId?: string;
};

export type VariableType =
  | string
  | string[]
  | number
  | number[]
  | boolean
  | boolean[]
  | undefined;

export type ChatStoreVariables = {
  userMessage?: string;
} & Record<string, VariableType>;

export type ChatStoreState = {
  variables: ChatStoreVariables;
};

export type ChatMessageRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatMessageRole;
  content?: string | any;
  meta?: {
    model?: string;
    human?: boolean;
    timestamp?: string;
  };
};

export type Interview = {
  name: string;
  description: string;
  guidelines: string;
  moderator: string;
  interviewer: string;
  goals?: string[];
  summary?: string;
};

export type ChatSession = ChatSessionsSelect & {
  state: ChatStoreState & {
    interview?: Interview;
  };
  messages: ChatMessage[];
};

export type PlaceholderArgumentDict = Record<
  string,
  string | number | boolean | undefined
>;

export type PlaceholderParser = {
  name: string;
  expression?: RegExp; // e.g. /{{#url="([^"]+)"(?:\s+(?:comment)=(?:"[^"]*"|[^}\s]+))*}}/
  requiredArguments?: string[]; // a simple list of required arguments for the placeholder
  arguments?: {
    // a complex list of arguments for the placeholder
    name: string;
    required?: boolean;
    type?: "string" | "number" | "boolean";
    multiple?: boolean;
    default?: string | number | boolean;
  }[];
  replacerFunction: (
    match: string,
    args: PlaceholderArgumentDict,
    variables: ChatStoreVariables,
    meta: ChatSessionContext
  ) => Promise<{
    content: string;
    skipThisBlock?: boolean;
    addToMeta?: Record<string, any>;
  }>;
};

/**
 * Chat Store
 */

class ChatHistoryStoreInDb {
  constructor(private maxAgeHours: number = 48) {
    setInterval(() => this.cleanup(), 1000 * 60 * 60);
  }

  getDeleteAt(): string | null {
    return this.maxAgeHours
      ? new Date(Date.now() + this.maxAgeHours * 60 * 60 * 1000).toISOString()
      : null;
  }

  async create(options: {
    chatId?: string;
    variables?: ChatStoreVariables;
    context: NewChatSessionContext;
    messages?: ChatMessage[];
    interview?: {
      name: string;
      description: string;
      guidelines: string;
    };
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
          interview: options.interview,
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

  async setVariable(
    chatId: string,
    key: string,
    value: VariableType,
    session?: ChatSession
  ): Promise<ChatStoreVariables> {
    log.logCustom(
      { name: chatId },
      `Update variable ${key} in chat session ${chatId}`
    );

    const currentSession = session || (await this.get(chatId));
    if (!currentSession) throw new Error(`Chat session ${chatId} not found`);

    const newState: ChatStoreState = currentSession.state as ChatStoreState;
    newState.variables[key] = value;

    await getDb()
      .update(chatSessions)
      .set({
        state: newState,
        updatedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      })
      .where(eq(chatSessions.id, chatId));

    if (session) {
      session.state.variables = newState.variables;
    }

    return newState.variables;
  }

  async mergeVariables(
    chatId: string,
    variables: ChatStoreVariables,
    session?: ChatSession
  ): Promise<ChatStoreVariables> {
    log.logCustom(
      { name: chatId },
      `Merge variables in chat session ${chatId}`
    );

    const currentSession = session || (await this.get(chatId));
    if (!currentSession) throw new Error(`Chat session ${chatId} not found`);

    const newState = { ...currentSession.state };
    newState.variables = { ...newState.variables, ...variables };

    await getDb()
      .update(chatSessions)
      .set({
        state: newState,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chatSessions.id, chatId));

    if (session) {
      session.state.variables = newState.variables;
    }

    return newState.variables;
  }

  async getVariable(chatId: string, key: string): Promise<VariableType> {
    log.logCustom(
      { name: chatId },
      `Get variable ${key} from chat session ${chatId}`
    );
    const session = await this.get(chatId);
    if (!session) throw new Error(`Chat session ${chatId} not found`);
    return session.state.variables[key] ?? undefined;
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
}

export const chatStore = new ChatHistoryStoreInDb(48);
