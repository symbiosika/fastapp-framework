import { getDb } from "../db/db-connection";
import {
  chatSessionGroupAssignments,
  chatSessions,
  chatSessionGroups,
} from "../db/schema/chat";
import { eq, and, desc, gte, lte, or, exists, inArray } from "drizzle-orm";
import type {
  ChatSessionsInsert,
  ChatSessionsUpdate,
  ChatSessionsSelect,
  ChatSessionGroupsInsert,
  ChatSessionGroupsSelect,
  ChatSessionGroupsUpdate,
  ChatSessionGroupAssignmentsSelect,
} from "../db/schema/chat";

/**
 * Create a new chat session.
 */
export async function createChatSession(
  data: ChatSessionsInsert
): Promise<ChatSessionsSelect> {
  const db = getDb();

  // If chatSessionGroupId is provided in meta, verify the group exists
  if (data.chatSessionGroupId) {
    const group = await db
      .select()
      .from(chatSessionGroups)
      .where(eq(chatSessionGroups.id, data.chatSessionGroupId))
      .limit(1);

    if (group.length === 0) {
      throw new Error("Chat session group not found");
    }
  }

  const result = await db.insert(chatSessions).values(data).returning();
  return result[0];
}

/**
 * Retrieve a chat session by ID and organization ID.
 */
export async function getChatSession(
  id: string,
  organisationId: string
): Promise<ChatSessionsSelect | null> {
  const db = getDb();
  const result = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.id, id),
        eq(chatSessions.organisationId, organisationId)
      )
    );
  return result.length > 0 ? result[0] : null;
}

/**
 * Update an existing chat session by ID and organization ID.
 */
export async function updateChatSession(
  id: string,
  organisationId: string,
  data: ChatSessionsUpdate
): Promise<ChatSessionsSelect | null> {
  const db = getDb();
  const result = await db
    .update(chatSessions)
    .set(data)
    .where(
      and(
        eq(chatSessions.id, id),
        eq(chatSessions.organisationId, organisationId)
      )
    )
    .returning();
  return result.length > 0 ? result[0] : null;
}

/**
 * Delete a chat session by ID and organization ID.
 */
export async function deleteChatSession(
  id: string,
  organisationId: string
): Promise<void> {
  const db = getDb();
  await db
    .delete(chatSessions)
    .where(
      and(
        eq(chatSessions.id, id),
        eq(chatSessions.organisationId, organisationId)
      )
    );
}

/**
 * Advanced query function for chat sessions with optional filters.
 */
interface QueryFilters {
  chatSessionGroupId?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

/**
 * Query chat sessions based on filter criteria.
 */
export async function queryChatSessions(
  organisationId: string,
  userId: string,
  filters: QueryFilters
): Promise<ChatSessionsSelect[]> {
  const db = getDb();
  let query = db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.organisationId, organisationId),
        or(
          eq(chatSessions.userId, userId),
          exists(
            db
              .select()
              .from(chatSessionGroupAssignments)
              .where(
                and(
                  eq(chatSessionGroupAssignments.userId, userId),

                  eq(
                    chatSessionGroupAssignments.chatSessionGroupId,
                    chatSessions.chatSessionGroupId
                  )
                )
              )
          )
        )
      )
    )
    .$dynamic();

  if (filters.chatSessionGroupId) {
    query = query.where(
      eq(chatSessions.chatSessionGroupId, filters.chatSessionGroupId)
    );
  }

  if (filters.startDate) {
    query = query.where(gte(chatSessions.createdAt, filters.startDate));
  }

  if (filters.endDate) {
    query = query.where(lte(chatSessions.createdAt, filters.endDate));
  }

  return await query.orderBy(desc(chatSessions.createdAt));
}

/**
 * Create a new chat session group.
 */
export async function createChatSessionGroup(
  data: ChatSessionGroupsInsert
): Promise<ChatSessionGroupsSelect> {
  const db = getDb();
  const result = await db.insert(chatSessionGroups).values(data).returning();
  return result[0];
}

/**
 * Get a chat session group by ID and organization ID.
 */
export async function getChatSessionGroup(
  id: string,
  organisationId: string
): Promise<ChatSessionGroupsSelect | null> {
  const db = getDb();
  const result = await db
    .select()
    .from(chatSessionGroups)
    .where(
      and(
        eq(chatSessionGroups.id, id),
        eq(chatSessionGroups.organisationId, organisationId)
      )
    );
  return result.length > 0 ? result[0] : null;
}

/**
 * Get all chat session groups that the user is a member of.
 */
export async function getChatSessionGroupsByUser(
  organisationId: string,
  userId: string
): Promise<ChatSessionGroupsSelect[]> {
  const db = getDb();
  const groups = await db
    .select()
    .from(chatSessionGroups)
    .where(
      and(
        eq(chatSessionGroups.organisationId, organisationId),
        exists(
          db
            .select()
            .from(chatSessionGroupAssignments)
            .where(
              and(
                eq(
                  chatSessionGroupAssignments.chatSessionGroupId,
                  chatSessionGroups.id
                ),
                eq(chatSessionGroupAssignments.userId, userId)
              )
            )
        )
      )
    )
    .orderBy(desc(chatSessionGroups.createdAt));

  return groups;
}

/**
 * Update an existing chat session group by ID and organization ID.
 * Only allows update if the user is a member of the group.
 */
export async function updateChatSessionGroup(
  id: string,
  organisationId: string,
  data: ChatSessionGroupsUpdate,
  userId: string
): Promise<ChatSessionGroupsSelect | null> {
  const db = getDb();

  // Check if the user is a member of the group
  const isMember = await db
    .select()
    .from(chatSessionGroupAssignments)
    .where(
      and(
        eq(chatSessionGroupAssignments.chatSessionGroupId, id),
        eq(chatSessionGroupAssignments.userId, userId)
      )
    )
    .limit(1);

  if (isMember.length === 0) {
    return null; // User is not a member
  }

  const result = await db
    .update(chatSessionGroups)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(chatSessionGroups.id, id),
        eq(chatSessionGroups.organisationId, organisationId)
      )
    )
    .returning();

  return result.length > 0 ? result[0] : null;
}

/**
 * Delete a chat session group by ID and organization ID.
 * Only allows deletion if the user is a member of the group.
 */
export async function deleteChatSessionGroup(
  id: string,
  organisationId: string,
  userId: string
): Promise<void> {
  const db = getDb();

  // Check if the user is a member of the group
  const isMember = await db
    .select()
    .from(chatSessionGroupAssignments)
    .where(
      and(
        eq(chatSessionGroupAssignments.chatSessionGroupId, id),
        eq(chatSessionGroupAssignments.userId, userId)
      )
    )
    .limit(1);

  if (isMember.length === 0) {
    throw new Error("User is not a member of the chat group.");
  }

  await db
    .delete(chatSessionGroups)
    .where(
      and(
        eq(chatSessionGroups.id, id),
        eq(chatSessionGroups.organisationId, organisationId)
      )
    );
}

/**
 * Add a user to a chat session group.
 */
export async function addUserToChatSessionGroup(
  groupId: string,
  userId: string
): Promise<ChatSessionGroupAssignmentsSelect> {
  const db = getDb();
  const assignment = await db
    .insert(chatSessionGroupAssignments)
    .values({ chatSessionGroupId: groupId, userId })
    .returning();
  return assignment[0];
}

/**
 * Remove a user from a chat session group.
 */
export async function removeUserFromChatSessionGroup(
  groupId: string,
  userId: string
): Promise<void> {
  const db = getDb();
  await db
    .delete(chatSessionGroupAssignments)
    .where(
      and(
        eq(chatSessionGroupAssignments.chatSessionGroupId, groupId),
        eq(chatSessionGroupAssignments.userId, userId)
      )
    );
}

/**
 * Add multiple users to a chat session group simultaneously.
 */
export async function addUsersToChatSessionGroup(
  groupId: string,
  userIds: string[]
): Promise<ChatSessionGroupAssignmentsSelect[]> {
  const db = getDb();
  const assignments = await db
    .insert(chatSessionGroupAssignments)
    .values(
      userIds.map((userId) => ({
        chatSessionGroupId: groupId,
        userId,
      }))
    )
    .returning();
  return assignments;
}

/**
 * Remove multiple users from a chat session group simultaneously.
 */
export async function removeUsersFromChatSessionGroup(
  groupId: string,
  userIds: string[]
): Promise<void> {
  const db = getDb();
  await db
    .delete(chatSessionGroupAssignments)
    .where(
      and(
        eq(chatSessionGroupAssignments.chatSessionGroupId, groupId),
        inArray(chatSessionGroupAssignments.userId, userIds)
      )
    );
}
