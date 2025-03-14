import { getDb } from "../../db/db-connection";
import { knowledgeEntry, knowledgeSource } from "../../db/schema/knowledge";
import { extractKnowledgeFromText } from "../knowledge/add-knowledge";
import { parseFile } from "../parsing";
import { eq } from "drizzle-orm";
import log from "../../log";

/**
 * Check if a knowledge entry needs to be updated based on external ID and change indicators
 */
export const checkIfKnowledgeNeedsUpdate = async (params: {
  externalId: string;
  lastChange?: string;
  lastHash?: string;
  organisationId: string;
}) => {
  const db = getDb();

  // Look up existing source by externalId
  const existingSource = await db
    .select()
    .from(knowledgeSource)
    .where(eq(knowledgeSource.externalId, params.externalId))
    .limit(1);

  if (existingSource.length === 0) {
    return { needsUpdate: true, existingEntry: null, existing: false };
  }

  const source = existingSource[0];

  let needsUpdate = false;

  // Compare timestamp if provided
  if (params.lastChange && source.lastChange) {
    const lastChangeDiffers =
      Math.abs(
        new Date(params.lastChange).getTime() -
          new Date(source.lastChange).getTime()
      ) > 1000; // 1 second tolerance

    if (lastChangeDiffers) {
      needsUpdate = true;
    }
  }

  // Compare hash if provided
  if (params.lastHash && source.lastHash) {
    if (params.lastHash !== source.lastHash) {
      needsUpdate = true;
    }
  }

  // Get the knowledge entry if it exists
  let entry = null;
  if (source.knowledgeEntryId) {
    entry = await db.query.knowledgeEntry.findFirst({
      where: eq(knowledgeEntry.id, source.knowledgeEntryId),
    });
  }

  return {
    needsUpdate,
    existing: true,
    existingEntry: entry,
    existingSource: source,
  };
};

/**
 * Process knowledge sync by handling update checks and content processing
 */
export const processKnowledgeSync = async (params: {
  organisationId: string;
  externalId: string;
  lastChange?: string;
  lastHash?: string;
  title: string;
  text?: string;
  file?: File;
  filters?: Record<string, string>;
  meta?: Record<string, any>;
  teamId?: string;
  userId?: string;
  workspaceId?: string;
}) => {
  // Check if content needs to be updated
  const { needsUpdate, existingSource } = await checkIfKnowledgeNeedsUpdate({
    externalId: params.externalId,
    lastChange: params.lastChange,
    lastHash: params.lastHash,
    organisationId: params.organisationId,
  });

  const db = getDb();
  const hasExistingSource = !!existingSource;

  // If no update needed, return existing entry
  if (!needsUpdate && existingSource) {
    return {
      id: existingSource.knowledgeEntryId,
      status: "unchanged" as const,
      ok: true,
    };
  }

  // Process new or updated content
  const status = hasExistingSource ? ("updated" as const) : ("added" as const);

  // If existing entry needs to be updated, delete it first
  if (existingSource) {
    log.debug(
      `Deleting existing knowledge entry ${existingSource.knowledgeEntryId} for update`
    );
    await db
      .delete(knowledgeEntry)
      .where(eq(knowledgeEntry.id, existingSource.knowledgeEntryId));

    await db
      .delete(knowledgeSource)
      .where(eq(knowledgeSource.id, existingSource.id));
  }

  // Extract knowledge
  let result;
  if (params.file) {
    // Process file
    const parsedFile = await parseFile(params.file);
    result = await extractKnowledgeFromText({
      organisationId: params.organisationId,
      title: params.title || params.file.name,
      text: parsedFile.text,
      filters: params.filters,
      metadata: params.meta,
      teamId: params.teamId,
      workspaceId: params.workspaceId,
      sourceType: "external",
      sourceExternalId: params.externalId,
    });
  } else if (params.text) {
    // Process text content
    result = await extractKnowledgeFromText({
      organisationId: params.organisationId,
      title: params.title,
      text: params.text,
      filters: params.filters,
      metadata: params.meta,
      teamId: params.teamId,
      workspaceId: params.workspaceId,
      sourceType: "external",
      sourceExternalId: params.externalId,
    });
  } else {
    throw new Error("Either file or text content is required");
  }

  // Create knowledge source entry
  const insertedSource = await db
    .insert(knowledgeSource)
    .values({
      externalId: params.externalId,
      knowledgeEntryId: result.id,
      lastChange: params.lastChange
        ? new Date(params.lastChange).toISOString()
        : new Date().toISOString(),
      lastHash: params.lastHash || null,
      meta: params.meta || {},
      lastSynced: new Date().toISOString(),
    })
    .returning();

  // Update the source ID in the knowledge entry
  await db
    .update(knowledgeEntry)
    .set({ sourceId: insertedSource[0].id })
    .where(eq(knowledgeEntry.id, result.id));

  log.debug(
    `Knowledge ${status} with ID ${result.id} for externalId ${params.externalId}`
  );

  return {
    id: result.id,
    status,
    ok: true,
  };
};
