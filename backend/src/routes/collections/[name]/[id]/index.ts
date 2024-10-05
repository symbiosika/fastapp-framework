import type { Context } from "hono";
import { parseFilterClause } from "../url-parser";
import {
  getPermissionDefinionForMethod,
  permissionCheckerViaBody,
} from "../permission-check";
import { mapConditionsToDrizzleWhereObject } from "../url-parser";
import {
  getDbSchemaTable,
  normalizeTableName,
} from "../../../../lib/db/db-get-schema";
import { HTTPException } from "hono/http-exception";
import { getDb } from "../../../../lib/db/db-connection";
import { dbSchema } from "src/lib/db/db-schema";

/**
 * GET Route for the collections endpoint
 * will return a single objects from the ORM by table name and id
 */
export const getCollectionById = async (c: Context) => {
  try {
    const userId = c.get("usersId");
    const tableNameRaw = c.req.param("name");
    const id = c.req.param("id");

    // check table-name and get schema
    const tableName = normalizeTableName(tableNameRaw ?? "");

    // check for some hidden tables
    // check permissions on the ressource for GET
    const definition = getPermissionDefinionForMethod(tableName, "GET");

    // start query
    const table = getDbSchemaTable(tableName);
    // for an GET with an given id we can build a direct query
    const filter = parseFilterClause(`id = '${id}'`);
    const where = mapConditionsToDrizzleWhereObject(
      dbSchema,
      tableName,
      filter
    );

    // @ts-ignore
    const data = await getDb()
      .select(definition.columns ?? undefined) // @ts-ignore
      .from(table) // @ts-ignore
      .where(where);

    if (data.length > 0) {
      // check permissions on the ressource
      await permissionCheckerViaBody(definition, userId, data[0]);

      return c.json(data[0]);
    } else {
      throw new HTTPException(404, { message: "Not found" });
    }
  } catch (err) {
    throw new HTTPException(400, { message: err + "" });
  }
};

/**
 * PUT Route for the collections endpoint
 * will update a single object in the ORM by table name and id
 */
export const putCollectionById = async (c: Context) => {
  try {
    const userId = c.get("usersId");

    let body = await c.req.json();
    const tableNameRaw = c.req.param("name");
    const id = c.req.param("id");

    // check table-name and get schema
    const tableName = normalizeTableName(tableNameRaw ?? "");

    // check for some hidden tables
    // check permissions on the ressource for GET
    const definition = getPermissionDefinionForMethod(tableName, "PUT");
    await permissionCheckerViaBody(definition, userId, body);

    // pre-actions necessary?
    if (definition.preAction) {
      body = await definition.preAction(userId, body);
    }

    if (definition.inserter) {
      const data = await definition.inserter(userId, body);
      return c.json(data ?? {});
    } else {
      // start query
      const table = getDbSchemaTable(tableName);

      // get old data by id
      const ast = parseFilterClause(`id = '${id}'`);
      const where = mapConditionsToDrizzleWhereObject(dbSchema, tableName, ast);
      // @ts-ignore
      const data = await getDb().select().from(table).where([where]);

      if (data.length > 0) {
        const entry = data[0];
        // merge with incoming body
        const updatedEntry = { ...entry, ...body, id: undefined };
        // @ts-ignore
        const updatedData = await getDb() // @ts-ignore
          .update(table) // @ts-ignore
          .set(updatedEntry) // @ts-ignore
          .where([where])
          .returning();

        return c.json(updatedData[0]);
      } else {
        throw new HTTPException(404, { message: "Not found" });
      }
    }
  } catch (err) {
    throw new HTTPException(400, { message: err + "" });
  }
};

/**
 * DELETE Route for the collections endpoint
 * will delete a single object in the ORM by table name and id
 */
export const deleteCollectionById = async (c: Context) => {
  try {
    const userId = c.get("usersId");
    const tableNameRaw = c.req.param("name");
    const id = c.req.param("id");

    // check table-name and get schema
    const tableName = normalizeTableName(tableNameRaw ?? "");

    // check for some hidden tables
    // check permissions on the ressource for GET
    const definition = getPermissionDefinionForMethod(tableName, "DELETE");

    // get table
    const table = getDbSchemaTable(tableName);

    // get url params
    const searchParams = new URLSearchParams(c.req.url.split("?")[1] || "");

    // check if a primary key is given to add the main id to the where clause
    const primaryKey = definition.neededParameters?.find(
      (param) => param.isPrimaryId
    );
    let filter;
    if (primaryKey) {
      filter = `${primaryKey.name} = '${id}'`;
    } else {
      // else use "id" as identifier
      filter = `id = '${id}'`;
    }
    const ast = parseFilterClause(filter);
    const where = mapConditionsToDrizzleWhereObject(dbSchema, tableName, ast);

    // pre-fetch data to check permissions on the item
    const item = await getDb()
      .select()
      // @ts-ignore
      .from(getDbSchemaTable(tableName))
      // @ts-ignore
      .where([where]);
    if (item?.length === 0) {
      throw new HTTPException(404, { message: "Not found" });
    }

    // check permissions on the ressource
    await permissionCheckerViaBody(definition, userId, item[0]);

    // @ts-ignore
    await getDb().delete(table).where([where]);

    return c.json({ message: "success" });
  } catch (err) {
    throw new HTTPException(400, { message: err + "" });
  }
};
