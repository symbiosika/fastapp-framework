import log from "src/lib/log";
import { getDb } from "../db-connection";
import { getDbSchemaTable, normalizeTableName } from "../db-get-schema";
import type { DBStandardData } from "./../../../types";

export const insertStandardDataEntry = async (
  data: DBStandardData[],
  forceOverwrite = false
) => {
  const db = getDb();
  const insertedIds: { [key: string]: any } = {};

  for (let tableCount = 0; tableCount < data.length; tableCount++) {
    const tableData = data[tableCount];
    const tableName = normalizeTableName(tableData.schemaName);
    const table = getDbSchemaTable(tableName) as any;

    for (let rowCount = 0; rowCount < tableData.entries.length; rowCount++) {
      const entry = tableData.entries[rowCount];

      // Replace placeholders in string fields
      for (const key in entry) {
        if (typeof entry[key] === "string") {
          entry[key] = entry[key].replace(
            /{{(\$\d+\.\d+)}}/g,
            (match, placeholder) => {
              const [tableIndex, rowIndex] = placeholder
                .slice(1)
                .split(".")
                .map(Number);
              return insertedIds[`${tableIndex}.${rowIndex}`] || match;
            }
          );
        }
      }

      try {
        let result;
        if (!forceOverwrite) {
          result = await db
            .insert(table)
            .values(entry)
            .onConflictDoNothing()
            .returning();
        } else {
          result = await db
            .insert(table)
            .values(entry)
            .onConflictDoUpdate({
              target: table.id,
              set: entry,
            })
            .returning();
        }

        if (result && Array.isArray(result) && result[0]) {
          const insertedId = result[0].id;
          insertedIds[`${tableCount + 1}.${rowCount + 1}`] = insertedId;
        }
      } catch (error) {
        log.error(
          `Error inserting standard data into ${tableData.schemaName}: ${error}`
        );
      }
    }
  }

  return insertedIds;
};
