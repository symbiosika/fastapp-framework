import { getDb } from "../../db/db-connection";
import { knowledgeEntry, knowledgeSource } from "../../db/schema/knowledge";
import { extractKnowledgeFromText } from "../knowledge/add-knowledge";
import log from "../../log";
import { eq } from "drizzle-orm";
import type { SyncItem } from "../../types/sync";

/**
 * Synchronizes a list of knowledge items from an external plugin source.
 * It will create new entries, delete entries that no longer exist in the source,
 * and replace entries that have changed.
 */
export const syncKnowledgeFromPlugin = async (
  pluginId: string,
  items: SyncItem[]
): Promise<{
  added: number;
  updated: number;
  deleted: number;
}> => {
  const db = getDb();

  // Fetch existing knowledge sources for this plugin
  const existingSources = await db
    .select()
    .from(knowledgeSource)
    .where(eq(knowledgeSource.pluginId, pluginId));

  const existingSourceMap = new Map<
    string,
    typeof knowledgeSource.$inferSelect
  >();

  // Create a map of existing sources for quick lookup
  existingSources.forEach((source) => {
    existingSourceMap.set(source.externalId, source);
  });

  // Arrays for items to add, update, and delete
  const itemsToAdd: SyncItem[] = [];
  const itemsToUpdate: {
    item: SyncItem;
    existingSource: typeof knowledgeSource.$inferSelect;
  }[] = [];
  const itemsToDelete: (typeof knowledgeSource.$inferSelect)[] = [];

  // Determine which items to add, update (delete and recreate), or delete
  for (const item of items) {
    const existingSource = existingSourceMap.get(item.externalId);

    if (!existingSource) {
      // Item does not exist, need to add
      itemsToAdd.push(item);
    } else {
      // Check if the lastChange or lastHash differs
      const lastChangeDiffers =
        item.lastChange && item.lastChange !== existingSource.lastChange;
      const lastHashDiffers =
        item.lastHash && item.lastHash !== existingSource.lastHash;

      if (lastChangeDiffers || lastHashDiffers) {
        // Item has changed, need to update (actually delete and recreate)
        itemsToUpdate.push({ item, existingSource });
      }

      // Remove from the map to prevent deletion
      existingSourceMap.delete(item.externalId);
    }
  }

  // Remaining items in existingSourceMap are to be deleted
  itemsToDelete.push(...existingSourceMap.values());

  // Process deletions
  for (const source of itemsToDelete) {
    await db
      .delete(knowledgeEntry)
      .where(eq(knowledgeEntry.id, source.knowledgeEntryId));

    await db.delete(knowledgeSource).where(eq(knowledgeSource.id, source.id));

    log.debug(
      `Deleted knowledge entry ${source.knowledgeEntryId} for source ${source.externalId}`
    );
  }

  // Process updates (delete old entries and create new ones)
  for (const { item, existingSource } of itemsToUpdate) {
    // Delete old knowledge entry
    await db
      .delete(knowledgeEntry)
      .where(eq(knowledgeEntry.id, existingSource.knowledgeEntryId));

    // Remove old knowledge source entry
    await db
      .delete(knowledgeSource)
      .where(eq(knowledgeSource.id, existingSource.id));

    // Create new knowledge entry
    const knowledgeResult = await extractKnowledgeFromText({
      title: item.title,
      text: item.text,
      metadata: item.meta,
    });

    // Create new knowledge source entry
    await db.insert(knowledgeSource).values({
      pluginId: pluginId,
      externalId: item.externalId,
      knowledgeEntryId: knowledgeResult.id,
      lastChange: item.lastChange,
      lastHash: item.lastHash,
      meta: item.meta || {},
    });

    log.debug(`Updated knowledge entry for externalId ${item.externalId}`);
  }

  // Process additions
  for (const item of itemsToAdd) {
    // Create new knowledge entry
    const knowledgeResult = await extractKnowledgeFromText({
      title: item.title,
      text: item.text,
      metadata: item.meta,
    });

    // Create new knowledge source entry
    await db.insert(knowledgeSource).values({
      pluginId: pluginId,
      externalId: item.externalId,
      knowledgeEntryId: knowledgeResult.id,
      lastChange: item.lastChange,
      lastHash: item.lastHash,
      meta: item.meta || {},
    });

    log.debug(`Added new knowledge entry for externalId ${item.externalId}`);
  }

  return {
    added: itemsToAdd.length,
    updated: itemsToUpdate.length,
    deleted: itemsToDelete.length,
  };
};
