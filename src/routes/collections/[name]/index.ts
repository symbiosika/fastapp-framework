import {
  getOrderBy,
  mapConditionsToDrizzleWhereObject,
  parseFilterClause,
} from "./url-parser";
import {
  getPermissionDefinionForMethod,
  permissionCheckerViaBody,
} from "./permission-check";
import {
  getDbSchemaTable,
  normalizeTableName,
} from "../../../lib/db/db-get-schema";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getDb } from "../../../lib/db/db-connection";
import { getDbSchema } from "../../../lib/db/db-schema";
import type { RawParameters } from "../../../lib/types/permission-checker";
import { and } from "drizzle-orm";
import { CsvService } from "../../../lib/csv";

const csvService = new CsvService();

const consoleDebug = (
  withObject: any,
  whereStatement: any,
  tablesToExpand: any
) => {
  console.log(
    "withObject",
    JSON.stringify(
      withObject,
      (key, value) => {
        if (key.startsWith("where")) {
          return undefined;
        }
        return value;
      },
      2
    )
  );

  console.log(
    "whereStatement",
    Object.keys(whereStatement ?? {}),
    "tablesToExpand",
    tablesToExpand
  );
};

const generateWithObject = (
  tablesToExpand: string[] | undefined,
  whereStatement: Record<string, any>
) => {
  if (!tablesToExpand) return undefined;

  const buildNestedWith = (tables: string[]): Record<string, any> => {
    if (tables.length === 0) return {};

    const [currentTable, ...remainingTables] = tables;
    return {
      [currentTable]: {
        where:
          currentTable in whereStatement
            ? whereStatement[currentTable]
            : undefined,
        with: buildNestedWith(remainingTables),
      },
    };
  };

  return buildNestedWith(tablesToExpand);
};

/**
 * GET Route for the collections endpoint
 * will return a list of objects from the ORM by table name
 * can be filtered by URL query parameters
 */
export const getCollection = async (c: Context) => {
  try {
    const userId = c.get("usersId");
    const tableNameRaw = c.req.param("name");

    // check the table-name and get schema. will throw an error if table does not exist in the schema
    const tableName = normalizeTableName(tableNameRaw ?? "");
    const table = getDbSchemaTable(tableName);

    // get the collection definition for the table.
    const definition = getPermissionDefinionForMethod(tableName, "GET");

    // The URL query parameters are optional and can be used to filter, sort and limit the result
    // expample:
    // http://localhost:3000/api/v1/db/collections/demo-data?filter=((id='278c7dfc1d-90e1-4c83-b7d1-3ce1dc39ac2e')||(users.id='278c7dfc1d-90e1-4c83-b7d1-3ce1dc39ac2e'))
    // or:
    // http://localhost:3000/api/v1/db/collections/users?filter=(userGroupMembers.userGroupId='d9698fcc-c359-42ba-8a96-2935163cbd29')
    // /api/v1/db/collections/users?expand=userGroupMembers&filter=(userGroupMembers.userGroupId=%27d9698fcc-c359-42ba-8a96-2935163cbd29%27)%26%26(createdAt>=%272023-01-01%27)

    // get the URL query parameters
    const searchParams = new URLSearchParams(c.req.url.split("?")[1] || "");

    // get the orderBy and orderAsc parameters
    const orderByParam = searchParams.get("orderBy") ?? undefined;
    const orderAscParam =
      searchParams.get("order") && searchParams.get("order") === "asc"
        ? true
        : false;
    const orderBy = getOrderBy(orderByParam, table, orderAscParam);

    // get the limit parameter
    const limitParam = searchParams.get("limit") ?? undefined;
    const limit = limitParam ? parseInt(limitParam) : undefined;

    // get the single parameter. if true, the result will be an object, otherwise an array
    const resultIsObject = searchParams.get("single") === "true" ? true : false;

    // get the filter parameter
    let filterString = searchParams.get("filter") ?? undefined;
    console.log("filterString", filterString);
    const filterClause = parseFilterClause(filterString);

    // get the expand parameter. if set, the result will be joined with the referenced tables
    const expandParam = searchParams.get("expand")?.split(",") ?? undefined;
    let tablesToExpand = expandParam
      ? expandParam.map((tableName) => normalizeTableName(tableName))
      : undefined;

    // get the columns parameter. if set, only these columns will be returned
    const columnsParam = searchParams.get("columns")?.split(",") ?? undefined;

    // get the csv parameter. if set, the result will be exported to a csv file
    const exportAsCsv = searchParams.get("csv") === "true" ? true : false;
    const csvSeparatorParam = searchParams.get("csvSeparator") ?? ",";
    const csvQuoteParam =
      searchParams.get("csvQuote") === "false" ? false : true;
    const csvHeaderParam =
      searchParams.get("csvHeader") === "false" ? false : true;

    const whereStatement = mapConditionsToDrizzleWhereObject(
      getDbSchema(),
      tableName,
      filterClause
    );

    const rawParameters: RawParameters = {
      userId,
      rawSearchParams: searchParams,
      tableName: tableNameRaw,
      orderBy: orderByParam,
      orderAsc: orderAscParam,
      limit,
      single: resultIsObject,
      columns: columnsParam,
      expand: expandParam,
      filter: filterString,
      where: whereStatement,
    };

    // check if there is a custom selector
    if (definition.selector) {
      const data = await definition.selector(userId, rawParameters);
      if (exportAsCsv) {
        const csv = await csvService.objectsToCsv(data, {
          separator: csvSeparatorParam,
          useQuotes: csvQuoteParam,
          header: csvHeaderParam,
        });
        return c.text(csv);
      }
      return c.json(data);
    }

    // check if the query has a custom where clause defined
    if (definition.customWhere) {
      whereStatement[tableName] = and(
        definition.customWhere(rawParameters),
        whereStatement[tableName]
      );
    }

    // get permission
    // await permissionCheckerViaUrlParams(definition, userId, parsedParams);

    const withObject = generateWithObject(tablesToExpand, whereStatement);
    consoleDebug(withObject, whereStatement, tablesToExpand);

    // @ts-ignore
    const data = await getDb().query[tableName].findMany({
      where:
        tableName in whereStatement ? whereStatement[tableName] : undefined,
      orderBy,
      limit,
      with: withObject,
      /*  with: {
        userGroupMembers: true,
      }, */
    });

    // Export as CSV?
    if (exportAsCsv) {
      const csv = await csvService.objectsToCsv(data, {
        separator: csvSeparatorParam,
        useQuotes: csvQuoteParam,
        header: csvHeaderParam,
      });
      return c.text(csv);
    }

    if (resultIsObject && Array.isArray(data)) {
      if (data.length === 0) {
        return c.json({});
      }
      return c.json(data[0]);
    } else {
      return c.json(data);
    }
  } catch (err) {
    throw new HTTPException(400, { message: err + "" });
  }
};

/**
 * POST Route for the collections endpoint
 * will create a new object in the ORM by table name
 */
export const postCollection = async (c: Context) => {
  try {
    const userId = c.get("usersId");

    let body = await c.req.json();
    const tableNameRaw = c.req.param("name");

    // check table-name and get schema
    const tableName = normalizeTableName(tableNameRaw ?? "");

    // check permissions on the ressource for GET
    const definition = getPermissionDefinionForMethod(tableName, "POST");
    await permissionCheckerViaBody(definition, userId, body);

    // pre-actions necessary?
    if (definition.preAction) {
      body = await definition.preAction(userId, body);
    }

    // start query
    const table = getDbSchemaTable(tableName);

    // create new object
    if (definition.inserter) {
      const data = await definition.inserter(userId, body);
      return c.json(data ?? {});
    } else {
      // if there was an id in the body. remove it since it should be auto-generated
      delete body.id;
      // @ts-ignore
      const data = await getDb().insert(table).values(body).returning();
      return c.json(data[0] ?? {});
    }
  } catch (err) {
    throw new HTTPException(400, { message: err + "" });
  }
};
