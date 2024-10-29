import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { nanoid } from "nanoid";

export interface ChatSession {
  messages: ChatCompletionMessageParam[];
  state: {
    functionMode?: boolean;
    knowledgeMode?: boolean;
    followUp?: boolean;
  };
  createdAt: Date;
  lastUsedAt: Date;
  id: string;
}

class ChatHistoryStore {
  private sessions: Map<string, ChatSession> = new Map();

  constructor(private maxAgeHours: number = 48) {
    // Start cleanup job every hour
    setInterval(() => this.cleanup(), 1000 * 60 * 60);
  }

  private create(chatId: string): ChatSession {
    const session: ChatSession = {
      id: chatId,
      messages: [],
      state: {},
      createdAt: new Date(),
      lastUsedAt: new Date(),
    };
    this.sessions.set(chatId, session);
    return session;
  }

  get(chatId?: string): ChatSession {
    if (!chatId) chatId = nanoid(16);

    const session = this.sessions.get(chatId);
    if (session) {
      session.lastUsedAt = new Date();
      return session;
    }
    return this.create(chatId);
  }

  set(
    chatId: string,
    messages: ChatCompletionMessageParam[],
    state = {}
  ): void {
    this.sessions.set(chatId, {
      messages,
      state,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      id: chatId,
    });
  }

  append(chatId: string, message: ChatCompletionMessageParam): void {
    const session = this.get(chatId);
    session.messages.push(message);
    session.lastUsedAt = new Date();
  }

  setState(
    chatId: string,
    key: keyof ChatSession["state"],
    value: boolean
  ): void {
    const session = this.get(chatId);
    session.state[key] = value;
    session.lastUsedAt = new Date();
  }

  cleanup(): void {
    const now = new Date();
    for (const [chatId, session] of this.sessions.entries()) {
      const hoursSinceLastUse =
        (now.getTime() - session.lastUsedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastUse > this.maxAgeHours) {
        this.sessions.delete(chatId);
      }
    }
  }
}

export const chatStore = new ChatHistoryStore(48);
