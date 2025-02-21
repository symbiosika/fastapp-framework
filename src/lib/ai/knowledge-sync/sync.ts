import { getDb } from "../../db/db-connection";
import { knowledgeEntry, knowledgeSource } from "../../db/schema/knowledge";
import { extractKnowledgeFromText } from "../knowledge/add-knowledge";
import log from "../../log";
import { eq } from "drizzle-orm";
import type { SyncItem, SyncResult, SyncItemStatus } from "../../types/sync";

/**
 * Synchronizes a list of knowledge items from an external plugin source.
 * It will create new entries, delete entries that no longer exist in the source,
 * and replace entries that have changed.
 */
export const syncKnowledgeFromPlugin = async (
  pluginId: string,
  organisationId: string,
  items: SyncItem[]
): Promise<SyncResult> => {
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

  // Track status of each item
  const itemStatuses: SyncItemStatus[] = [];

  // Determine which items to add, update (delete and recreate), or delete
  for (const item of items) {
    const existingSource = existingSourceMap.get(item.externalId);

    if (!existingSource) {
      itemsToAdd.push(item);
      itemStatuses.push({
        externalId: item.externalId,
        status: "added",
      });
    } else {
      const lastChangeDiffers =
        item.lastChange && existingSource.lastChange
          ? Math.abs(
              new Date(item.lastChange!).getTime() -
                new Date(existingSource.lastChange!).getTime()
            ) > 1000 // Toleranz von 1 Sekunde
          : item.lastChange !== existingSource.lastChange;

      const lastHashDiffers =
        item.lastHash && item.lastHash !== existingSource.lastHash;

      if (lastChangeDiffers || lastHashDiffers) {
        console.log(
          item.lastChange,
          existingSource.lastChange,
          new Date(item.lastChange!).getTime(),
          new Date(existingSource.lastChange!).getTime()
        );
        itemsToUpdate.push({ item, existingSource });
        itemStatuses.push({
          externalId: item.externalId,
          status: "updated",
        });
      }

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

    itemStatuses.push({
      externalId: source.externalId,
      status: "deleted",
    });
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
      organisationId: organisationId,
      title: item.title,
      text: item.text,
      metadata: item.meta,
      sourceType: "plugin",
      sourceFileBucket: undefined,
      sourceId: undefined,
      sourceUrl: undefined,
    });

    // Create new knowledge source entry
    const insertedSource = await db
      .insert(knowledgeSource)
      .values({
        pluginId: pluginId,
        externalId: item.externalId,
        knowledgeEntryId: knowledgeResult.id,
        lastChange: new Date(item.lastChange!).toISOString(),
        lastHash: item.lastHash,
        meta: item.meta || {},
        lastSynced: new Date().toISOString(),
      })
      .returning();

    // update the source id of the knowledge entry
    await db
      .update(knowledgeEntry)
      .set({ sourceId: insertedSource[0].id })
      .where(eq(knowledgeEntry.id, knowledgeResult.id));

    log.debug(`Updated knowledge entry for externalId ${item.externalId}`);

    itemStatuses.push({
      externalId: item.externalId,
      status: "updated",
    });
  }

  // Process additions
  for (const item of itemsToAdd) {
    // Create new knowledge entry
    const knowledgeResult = await extractKnowledgeFromText({
      organisationId: organisationId,
      title: item.title,
      text: item.text,
      metadata: item.meta,
      filters: item.filters,
      sourceType: "plugin",
      sourceFileBucket: undefined,
      sourceId: undefined,
      sourceUrl: undefined,
    });

    // Create new knowledge source entry
    const insertedSource = await db
      .insert(knowledgeSource)
      .values({
        pluginId: pluginId,
        externalId: item.externalId,
        knowledgeEntryId: knowledgeResult.id,
        lastChange: new Date(item.lastChange!).toISOString(),
        lastHash: item.lastHash,
        meta: item.meta || {},
        lastSynced: new Date().toISOString(),
      })
      .returning();

    // update the source id of the knowledge entry
    await db
      .update(knowledgeEntry)
      .set({ sourceId: insertedSource[0].id })
      .where(eq(knowledgeEntry.id, knowledgeResult.id));

    itemStatuses.push({
      externalId: item.externalId,
      status: "added",
    });

    log.debug(`Added knowledge entry for externalId ${item.externalId}`);
  }

  // Add unchanged items to status list
  items.forEach((item) => {
    if (!itemStatuses.some((status) => status.externalId === item.externalId)) {
      itemStatuses.push({
        externalId: item.externalId,
        status: "unchanged",
      });
    }
  });

  // Calculate unchanged items (total items minus changed ones)
  const unchangedCount =
    items.length - (itemsToAdd.length + itemsToUpdate.length);

  return {
    items: itemStatuses,
    stats: {
      added: itemsToAdd.length,
      updated: itemsToUpdate.length,
      deleted: itemsToDelete.length,
      unchanged: unchangedCount,
    },
  };
};
