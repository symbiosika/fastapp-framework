import log from "../../log";
import type { ArtifactReturn, SourceReturn } from "../ai-sdk/types";

export interface LiveChatData {
  text: string;
  complete: boolean;
  meta?: {
    toolsUsed?: string[];
    sources?: SourceReturn[];
    artifacts?: ArtifactReturn[];
    [key: string]: any;
  };
}

// In-memory cache for live chat responses
// In production, this should be replaced with a distributed cache like Redis
const liveChatCache = new Map<string, LiveChatData>();

/**
 * Updates the live chat cache for a given chatId
 */
export function updateLiveChat(
  chatId: string,
  data: Partial<LiveChatData>
): void {
  const current = liveChatCache.get(chatId) || {
    text: "",
    complete: false,
    meta: {},
  };

  liveChatCache.set(chatId, {
    ...current,
    ...data,
    meta: {
      ...current.meta,
      ...data.meta,
    },
  });
}

/**
 * Gets the current live chat data for a given chatId
 */
export function getLiveChat(chatId: string): LiveChatData | undefined {
  return liveChatCache.get(chatId);
}

/**
 * Clears the live chat cache for a given chatId
 */
export function clearLiveChat(chatId: string): void {
  liveChatCache.delete(chatId);
}
