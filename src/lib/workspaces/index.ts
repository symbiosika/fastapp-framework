import { and, eq, inArray, isNull, or, exists } from "drizzle-orm";
import { getDb } from "../db/db-connection";
import {
  workspaces,
  workspaceKnowledgeTexts,
  workspaceKnowledgeEntries,
  workspacePromptTemplates,
  workspaceChatGroups,
  workspaceChatSessions,
  type WorkspacesSelect,
  type CreateWorkspaceInput,
  type WorkspaceRelations,
  workspaceUsers,
} from "../db/schema/workspaces";
import { teamMembers } from "../db/schema/users";

/**
 * Helper to check if user has access to workspace
 * as a direct owner or part of a team that owns the workspace
 */
export const hasAccessToWorkspace = async (
  workspaceId: string,
  userId: string
) => {
  const teams = await getDb().query.teamMembers.findMany({
    where: eq(teamMembers.userId, userId),
    columns: { teamId: true },
  });
  const teamIds = teams.map((t) => t.teamId);

  const workspaceMembers = await getDb().query.workspaceUsers.findMany({
    where: eq(workspaceUsers.userId, userId),
    columns: { workspaceId: true },
  });
  const workspaceIds = workspaceMembers.map((w) => w.workspaceId);

  const workspace = await getDb().query.workspaces.findFirst({
    where: and(
      eq(workspaces.id, workspaceId),
      or(
        eq(workspaces.userId, userId),
        inArray(workspaces.teamId, teamIds),
        inArray(workspaces.id, workspaceIds)
      )
    ),
  });
  return !!workspace;
};

/**
 * Create a new workspace with optional relations
 */
export const createWorkspace = async (
  userId: string,
  input: CreateWorkspaceInput
) => {
  // Create workspace
  const [workspace] = await getDb()
    .insert(workspaces)
    .values(input)
    .returning();

  // Add optional relations
  await addToWorkspace(
    workspace.id,
    {
      knowledgeTextIds: input.knowledgeTextIds,
      knowledgeEntryIds: input.knowledgeEntryIds,
      promptTemplateIds: input.promptTemplateIds,
      chatGroupIds: input.chatGroupIds,
      chatSessionIds: input.chatSessionIds,
    },
    userId
  );

  return workspace;
};

/**
 * Get workspace by its ID
 * will check if user has access to workspace
 */
export const getWorkspaceById = async (id: string, userId: string) => {
  if (!(await hasAccessToWorkspace(id, userId))) {
    throw new Error("User does not have permission to access workspace");
  }

  return await getDb().query.workspaces.findFirst({
    where: eq(workspaces.id, id),
  });
};

/**
 * Get all workspaces accessible by user
 * Filters by personal workspaces and team workspaces the user is part of
 */
export const getAllUsersWorkspaces = async (
  userId: string,
  parentId?: string | null
) => {
  // Get teams the user is part of
  const userTeams = await getDb().query.teamMembers.findMany({
    where: eq(teamMembers.userId, userId),
    columns: { teamId: true },
  });
  const teamIds = userTeams.map((tm) => tm.teamId);

  // Get workspaces where:
  // 1. user is owner OR
  // 2. user's team is owner OR
  // 3. user is a member
  return await getDb().query.workspaces.findMany({
    where: and(
      or(
        eq(workspaces.userId, userId),
        inArray(workspaces.teamId, teamIds),
        exists(
          getDb()
            .select()
            .from(workspaceUsers)
            .where(
              and(
                parentId
                  ? eq(workspaceUsers.workspaceId, parentId)
                  : isNull(workspaceUsers.workspaceId),
                eq(workspaceUsers.userId, userId)
              )
            )
        )
      ),
      parentId ? eq(workspaces.parentId, parentId) : isNull(workspaces.parentId)
    ),
    orderBy: (workspaces) => workspaces.name,
  });
};

/**
 * Update workspace meta information
 * will check if user has access to workspace
 */
export const updateWorkspace = async (
  id: string,
  input: Partial<WorkspacesSelect>,
  userId: string
) => {
  if (!(await hasAccessToWorkspace(id, userId))) {
    throw new Error("User does not have permission to update workspace");
  }

  const [updated] = await getDb()
    .update(workspaces)
    .set({
      name: input.name,
      description: input.description,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(workspaces.id, id))
    .returning();

  return updated;
};

/**
 * Delete a workspace by its ID
 * will check if user has access to workspace
 */
export const deleteWorkspace = async (id: string, userId: string) => {
  if (!(await hasAccessToWorkspace(id, userId))) {
    throw new Error("User does not have permission to access workspace");
  }
  await getDb().delete(workspaces).where(eq(workspaces.id, id));
};

/**
 * Add relations to a workspace
 * will take array of ids and add them to the workspace
 * will check if user has access to workspace
 */
export const addToWorkspace = async (
  workspaceId: string,
  relations: WorkspaceRelations,
  userId: string
) => {
  if (!(await hasAccessToWorkspace(workspaceId, userId))) {
    throw new Error(
      "User does not have permission to add relations to workspace"
    );
  }

  if (relations.knowledgeTextIds?.length) {
    await getDb()
      .insert(workspaceKnowledgeTexts)
      .values(
        relations.knowledgeTextIds.map((id) => ({
          workspaceId,
          knowledgeTextId: id,
        }))
      );
  }

  if (relations.knowledgeEntryIds?.length) {
    await getDb()
      .insert(workspaceKnowledgeEntries)
      .values(
        relations.knowledgeEntryIds.map((id) => ({
          workspaceId,
          knowledgeEntryId: id,
        }))
      );
  }

  if (relations.promptTemplateIds?.length) {
    await getDb()
      .insert(workspacePromptTemplates)
      .values(
        relations.promptTemplateIds.map((id) => ({
          workspaceId,
          promptTemplateId: id,
        }))
      );
  }

  if (relations.chatGroupIds?.length) {
    await getDb()
      .insert(workspaceChatGroups)
      .values(
        relations.chatGroupIds.map((id) => ({
          workspaceId,
          chatGroupId: id,
        }))
      );
  }

  if (relations.chatSessionIds?.length) {
    await getDb()
      .insert(workspaceChatSessions)
      .values(
        relations.chatSessionIds.map((id) => ({
          workspaceId,
          chatSessionId: id,
        }))
      );
  }
};

/**
 * Remove relations from a workspace
 * will take array of ids and remove them from the workspace
 * will check if user has access to workspace
 */
export const dropFromWorkspace = async (
  workspaceId: string,

  relations: WorkspaceRelations,
  userId: string
) => {
  if (!(await hasAccessToWorkspace(workspaceId, userId))) {
    throw new Error(
      "User does not have permission to drop relations from workspace"
    );
  }

  if (relations.knowledgeTextIds?.length) {
    await getDb()
      .delete(workspaceKnowledgeTexts)
      .where(
        and(
          eq(workspaceKnowledgeTexts.workspaceId, workspaceId),
          inArray(
            workspaceKnowledgeTexts.knowledgeTextId,
            relations.knowledgeTextIds
          )
        )
      );
  }

  if (relations.knowledgeEntryIds?.length) {
    await getDb()
      .delete(workspaceKnowledgeEntries)
      .where(
        and(
          eq(workspaceKnowledgeEntries.workspaceId, workspaceId),
          inArray(
            workspaceKnowledgeEntries.knowledgeEntryId,
            relations.knowledgeEntryIds
          )
        )
      );
  }

  if (relations.promptTemplateIds?.length) {
    await getDb()
      .delete(workspacePromptTemplates)
      .where(
        and(
          eq(workspacePromptTemplates.workspaceId, workspaceId),
          inArray(
            workspacePromptTemplates.promptTemplateId,
            relations.promptTemplateIds
          )
        )
      );
  }

  if (relations.chatGroupIds?.length) {
    await getDb()
      .delete(workspaceChatGroups)
      .where(
        and(
          eq(workspaceChatGroups.workspaceId, workspaceId),
          inArray(workspaceChatGroups.chatGroupId, relations.chatGroupIds)
        )
      );
  }

  if (relations.chatSessionIds?.length) {
    await getDb()
      .delete(workspaceChatSessions)
      .where(
        and(
          eq(workspaceChatSessions.workspaceId, workspaceId),
          inArray(workspaceChatSessions.chatSessionId, relations.chatSessionIds)
        )
      );
  }
};

/**
 * Get all child workspaces for a given parent workspace ID
 * Will check if user has access to parent workspace
 */
export const getChildWorkspaces = async (parentId: string, userId: string) => {
  // First verify user has access to parent workspace
  if (!(await hasAccessToWorkspace(parentId, userId))) {
    throw new Error("User does not have permission to access workspace");
  }

  return await getDb().query.workspaces.findMany({
    where: eq(workspaces.parentId, parentId),
  });
};

/**
 * Get the parent workspace of a workspace
 * Will check if user has access to workspace
 */
export const getParentWorkspace = async (
  workspaceId: string,
  userId: string
) => {
  if (!(await hasAccessToWorkspace(workspaceId, userId))) {
    throw new Error("User does not have permission to access workspace");
  }

  return await getDb().query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });
};
