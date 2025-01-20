import { and, desc, eq, gte, lte } from "drizzle-orm";
import { chatSessions } from "../../db/schema/chat";
import { getDb } from "../../db/db-connection";
import log from "../../log";
import type {
  ChatHistoryStore,
  ChatMessage,
  ParsedTemplateBlocks,
  VariableDictionary,
  VariableType,
  VariableTypeInMemory,
  ChatSession,
  VariableDictionaryInMemory,
  ChatSessionWithTemplate,
} from "magic-prompt";
import { nanoid } from "nanoid";

class ChatHistoryStoreInDb implements ChatHistoryStore {
  constructor(private maxAgeHours: number = 48) {
    setInterval(() => this.cleanup(), 1000 * 60 * 60);
  }

  async create(options?: {
    chatId?: string;
    useTemplate?: ParsedTemplateBlocks;
    userId: string;
  }): Promise<ChatSession> {
    const chatId = options?.chatId || nanoid(16);
    log.debug(`Create chat session ${chatId}`);

    const session = {
      id: chatId,
      name: `Chat ${chatId}`,
      userId: options?.userId,
      fullHistory: [],
      actualChat: [],
      createdAt: new Date(),
      lastUsedAt: new Date(),
      state: options?.useTemplate
        ? {
            useTemplate: {
              def: options.useTemplate,
              blockIndex: 0,
            },
            variables: {},
          }
        : {
            useTemplate: undefined,
            variables: {},
          },
    } as ChatSession;

    await getDb()
      .insert(chatSessions)
      .values({
        id: chatId,
        name: `Chat ${chatId}`,
        userId: options?.userId,
        messages: session.actualChat,
        state: session.state,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.lastUsedAt.toISOString(),
      });

    return session;
  }

  async get(chatId: string): Promise<ChatSession | null> {
    const result = await getDb()
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, chatId));

    if (result.length === 0) {
      log.debug(`Chat session ${chatId} not found`);
      return null;
    }
    const session = result[0];

    const updatedSession = await getDb()
      .update(chatSessions)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(chatSessions.id, chatId))
      .returning();

    return {
      id: updatedSession[0].id,
      name: updatedSession[0].name,
      fullHistory: updatedSession[0].messages as ChatMessage[],
      actualChat: updatedSession[0].messages as ChatMessage[],
      state: updatedSession[0].state as any,
      createdAt: new Date(updatedSession[0].createdAt),
      lastUsedAt: new Date(updatedSession[0].updatedAt),
    };
  }

  async drop(chatId: string): Promise<void> {
    await getDb().delete(chatSessions).where(eq(chatSessions.id, chatId));
  }

  async set(
    chatId: string,
    set: {
      actualChat?: ChatMessage[];
      appendToHistory?: ChatMessage[];
      template?: ParsedTemplateBlocks;
      blockIndex?: number;
      name?: string;
    },
    session?: ChatSessionWithTemplate
  ): Promise<VariableDictionaryInMemory> {
    log.debug(`Update chat session ${chatId}`);

    const currentSession = session || (await this.get(chatId));
    if (!currentSession) throw new Error(`Chat session ${chatId} not found`);

    const newState = { ...currentSession.state };
    if (set.template) {
      newState.useTemplate = {
        def: set.template,
        blockIndex: set.blockIndex ?? 0,
      };
    }

    if (set.blockIndex !== undefined && newState.useTemplate) {
      newState.useTemplate.blockIndex = set.blockIndex;
    }

    // Append messages to the current chat history if appendToHistory is provided
    const updatedMessages = set.appendToHistory
      ? [...currentSession.actualChat, ...set.appendToHistory]
      : set.actualChat || currentSession.actualChat;
    if (session) {
      session.actualChat = updatedMessages;
    }

    await getDb()
      .update(chatSessions)
      .set({
        messages: updatedMessages,
        state: newState,
        name: set.name ?? undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chatSessions.id, chatId));

    if (session) {
      session.state.variables = newState.variables;
    }

    return newState.variables;
  }

  async setVariable(
    chatId: string,
    key: string,
    value: VariableType,
    session?: ChatSessionWithTemplate
  ): Promise<VariableDictionaryInMemory> {
    log.debug(`Update variable ${key} in chat session ${chatId}`);

    const currentSession = session || (await this.get(chatId));
    if (!currentSession) throw new Error(`Chat session ${chatId} not found`);

    const newState = { ...currentSession.state };
    newState.variables[key] = value;

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

  async mergeVariables(
    chatId: string,
    variables: VariableDictionary,
    session?: ChatSessionWithTemplate
  ): Promise<VariableDictionaryInMemory> {
    log.debug(`Merge variables in chat session ${chatId}`);

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

  async getVariable(
    chatId: string,
    key: string
  ): Promise<VariableTypeInMemory> {
    log.debug(`Get variable ${key} from chat session ${chatId}`);

    const session = await this.get(chatId);
    if (!session) throw new Error(`Chat session ${chatId} not found`);
    return session.state.variables[key];
  }

  async appendToMemory(
    chatId: string,
    memoryKey: string,
    value: VariableType,
    session?: ChatSessionWithTemplate
  ): Promise<VariableDictionaryInMemory> {
    log.debug(`Append to memory ${memoryKey} in chat session ${chatId}`);

    const currentSession = session || (await this.get(chatId));
    if (!currentSession) throw new Error(`Chat session ${chatId} not found`);

    const newState = { ...currentSession.state };
    const currentMemory = newState.variables[memoryKey];

    if (Array.isArray(currentMemory)) {
      newState.variables[memoryKey] = [
        ...currentMemory,
        value,
      ] as VariableTypeInMemory;
    } else {
      newState.variables[memoryKey] = [value] as VariableTypeInMemory;
    }

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

  async cleanup(): Promise<void> {
    log.debug(`Cleanup chat sessions`);

    const cutoffDate = new Date(Date.now() - this.maxAgeHours * 60 * 60 * 1000);
    await getDb()
      .delete(chatSessions)
      .where(lte(chatSessions.updatedAt, cutoffDate.toISOString()));
  }

  async getHistoryByUserId(
    userId: string,
    startFrom: string
  ): Promise<{ chatId: string; name: string; history: ChatMessage[] }[]> {
    log.debug(`Get chat history for user ${userId}`);

    const result = await getDb()
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.userId, userId),
          gte(chatSessions.updatedAt, startFrom)
        )
      )
      .orderBy(desc(chatSessions.updatedAt));
    return result.map((r) => ({
      chatId: r.id,
      name: r.name,
      history: r.messages as ChatMessage[],
      updatedAt: r.updatedAt,
    }));
  }

  async getChatHistory(chatId: string): Promise<ChatMessage[]> {
    log.debug(`Get chat history for chat ${chatId}`);

    const session = await this.get(chatId);
    if (!session) throw new Error(`Chat session ${chatId} not found`);
    return session.fullHistory;
  }
}

export const chatStoreInDb = new ChatHistoryStoreInDb(48);
