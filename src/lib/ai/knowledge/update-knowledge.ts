import { getDb } from "../../../lib/db/db-connection";
import { and, eq } from "drizzle-orm";
import { knowledgeEntry, knowledgeText } from "../../db/schema/knowledge";
import { deleteFileFromDB } from "../../storage/db";
import { deleteFileFromLocalDisc } from "../../storage/local";
import { isUserPartOfTeam } from "../../usermanagement/teams";
import { validateKnowledgeAccess } from "./permissions";

/**
 * Delete a knowledge entry by ID
 * will check if the user has permission to delete the knowledge entry
 */
export const deleteKnowledgeEntry = async (
  id: string,
  organisationId: string,
  userId: string,
  deleteSource = false
) => {
  // check the user permissions
  const canDelete = await validateKnowledgeAccess(id, userId, organisationId);
  if (!canDelete) {
    throw new Error(
      "User does not have permission to delete this knowledge entry"
    );
  }

  // also delete the source if requested
  if (deleteSource) {
    const e = await getDb().query.knowledgeEntry.findFirst({
      where: and(
        eq(knowledgeEntry.id, id),
        eq(knowledgeEntry.organisationId, organisationId)
      ),
    });
    if (e?.sourceType === "db" && e.sourceId && e.sourceFileBucket) {
      await deleteFileFromDB(e.sourceId, e.sourceFileBucket, organisationId);
    } else if (e?.sourceType === "local" && e.sourceId && e.sourceFileBucket) {
      await deleteFileFromLocalDisc(
        e.sourceId,
        e.sourceFileBucket,
        organisationId
      );
    } else if (e?.sourceType === "text" && e.sourceId) {
      await getDb()
        .delete(knowledgeText)
        .where(eq(knowledgeText.id, e.sourceId));
    }
  }
  await getDb().delete(knowledgeEntry).where(eq(knowledgeEntry.id, id));
};

/**
 * Update a knowledge entry by ID
 * Only the name can be updated
 */
export const updateKnowledgeEntry = async (
  id: string,
  organisationId: string,
  userId: string,
  data: {
    name?: string | undefined;
    teamId?: string | null;
    workspaceId?: string | null;
    knowledgeGroupId?: string | null;
    userOwned?: boolean;
    description?: string | null;
    abstract?: string | null;
  }
) => {
  const canUpdate = await validateKnowledgeAccess(id, userId, organisationId);
  if (!canUpdate) {
    throw new Error(
      "User does not have permission to update this knowledge entry"
    );
  }

  // is a new teamId provided?
  if (data.teamId) {
    const isPartOfTeam = await isUserPartOfTeam(userId, data.teamId);
    if (!isPartOfTeam) {
      throw new Error("User is not part of the provided team");
    }
  }

  const r = await getDb()
    .update(knowledgeEntry)
    .set(data)
    .where(eq(knowledgeEntry.id, id))
    .returning();

  return r[0];
};
