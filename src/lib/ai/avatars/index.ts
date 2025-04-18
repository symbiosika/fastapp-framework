// src/lib/avatars/index.ts
import { and, eq, or, isNull } from "drizzle-orm";
import { AvatarInsert, AvatarSelect } from "../../db/db-schema";
import { avatars } from "../../db/schema/avatars";
import { getDb } from "../../db/db-connection";
import { ChatMessage } from "../../../types";
import { checkOrganisationMemberRole } from "../../usermanagement/oganisations";
import type { SQL } from "drizzle-orm";

export async function createAvatar(data: AvatarInsert): Promise<AvatarSelect> {
  // Check permissions
  if (data.userId && data.organisationWide) {
    await checkOrganisationMemberRole(data.organisationId, data.userId, [
      "admin",
      "owner",
    ]);
  }

  const db = getDb();
  const result = await db.insert(avatars).values(data).returning();
  return result[0];
}

export async function getAvatarByName(
  organisationId: string,
  name: string,
  context?: { userId?: string }
): Promise<AvatarSelect> {
  const db = getDb();
  const baseCondition = and(
    eq(avatars.organisationId, organisationId),
    eq(avatars.name, name)
  );

  const whereCondition = context?.userId
    ? and(
        baseCondition,
        or(
          eq(avatars.userId, context.userId),
          eq(avatars.organisationWide, true)
        )
      )
    : baseCondition;

  const result = await db.select().from(avatars).where(whereCondition).limit(1);

  if (result.length === 0) {
    throw new Error("Avatar not found");
  }
  return result[0];
}

export async function getAvatar(
  organisationId: string,
  avatarId: string,
  context?: { userId?: string }
): Promise<AvatarSelect> {
  const db = getDb();
  const baseCondition = and(
    eq(avatars.organisationId, organisationId),
    eq(avatars.id, avatarId)
  );

  const whereCondition = context?.userId
    ? and(
        baseCondition,
        or(
          eq(avatars.userId, context.userId),
          eq(avatars.organisationWide, true)
        )
      )
    : baseCondition;

  const result = await db.select().from(avatars).where(whereCondition);

  if (result.length === 0) {
    throw new Error("Avatar not found");
  }
  return result[0];
}

export async function listAvatars(
  organisationId: string,
  context?: { userId?: string }
): Promise<AvatarSelect[]> {
  const db = getDb();
  const baseCondition = eq(avatars.organisationId, organisationId);

  const whereCondition = context?.userId
    ? and(
        baseCondition,
        or(
          eq(avatars.userId, context.userId),
          eq(avatars.organisationWide, true)
        )
      )
    : baseCondition;

  return await db.select().from(avatars).where(whereCondition);
}

export async function updateAvatar(
  id: string,
  data: Partial<AvatarInsert>,
  context: { organisationId: string; userId?: string }
): Promise<AvatarSelect | undefined> {
  // First check if user has permission to update this entry
  const existing = await getAvatar(context.organisationId, id, {
    userId: context.userId,
  });

  // Check permissions
  if (context.userId) {
    if (existing.organisationWide) {
      await checkOrganisationMemberRole(
        context.organisationId,
        context.userId,
        ["admin", "owner"]
      );
    }
  }

  const db = getDb();
  const result = await db
    .update(avatars)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(avatars.id, id))
    .returning();
  return result[0];
}

export async function deleteAvatar(
  id: string,
  context: { organisationId: string; userId?: string }
): Promise<boolean> {
  // First check if user has permission to delete this entry
  const existing = await getAvatar(context.organisationId, id, {
    userId: context.userId,
  });

  // Check permissions
  if (context.userId) {
    if (existing.organisationWide) {
      await checkOrganisationMemberRole(
        context.organisationId,
        context.userId,
        ["admin", "owner"]
      );
    }
  }

  const db = getDb();
  const result = await db.delete(avatars).where(eq(avatars.id, id)).returning();
  return result.length > 0;
}

// Helper function to convert avatar to chat message
function avatarToChatMessage(avatar: AvatarSelect): ChatMessage {
  return {
    role: "assistant",
    content: avatar.description,
  };
}

export const getAvatarForChat = async (
  userId: string,
  organisationId: string,
  name: string
): Promise<ChatMessage> => {
  const avatar = await getAvatarByName(organisationId, name, {
    userId,
  });
  return avatarToChatMessage(avatar);
};
