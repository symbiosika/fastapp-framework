import pg from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { getDbSchema, type DatabaseSchema } from "./db-schema";

const POSTGRES_DB = process.env.POSTGRES_DB ?? "";
const POSTGRES_USER = process.env.POSTGRES_USER ?? "";
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? "";
const POSTGRES_HOST = process.env.POSTGRES_HOST ?? "";
const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT ?? "5432");
const POSTGRE_CA_CERT = process.env.POSTGRE_CA_CERT ?? "";

// hold the connection
let drizzleClient: NodePgDatabase<DatabaseSchema>;
let dbClient: pg.PoolClient | pg.Client;

const createPool = () => {
  return new pg.Pool({
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    database: POSTGRES_DB,
    max: 10,
    idleTimeoutMillis: 60000,
    ssl: {
      rejectUnauthorized: false,
      ca: POSTGRE_CA_CERT,
    },
  });
};

const createClient = async () => {
  return new pg.Client({
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    database: POSTGRES_DB,
    ssl: {
      rejectUnauthorized: false,
      ca: POSTGRE_CA_CERT,
    },
  });
};

const setupPoolListeners = (pool: pg.Pool) => {
  pool.on("connect", () => console.log("PG Pool connected to the database"));
  pool.on("error", (err) => console.error("PG Pool Error ", err));
};

const setupClientListeners = (client: pg.PoolClient) => {
  client.on("error", async (err) => {
    console.error("PG Client error:", err.stack);
    client.release();
    await createDatabaseClient();
  });

  client.on("end", async () => {
    console.error("PG Client ended the connection.");
    await createDatabaseClient();
  });

  client.on("notification", (msg) =>
    console.log("PG Client notification:", msg)
  );
  client.on("notice", (msg) => console.log("PG Client notice:", msg));
};

export const createDatabaseClient = async (
  customSchema?: Record<string, unknown>
) => {
  if (drizzleClient) {
    console.log("DB Client already initialized");
    return drizzleClient;
  }

  const pool = createPool();
  setupPoolListeners(pool);

  dbClient = await pool.connect();
  setupClientListeners(dbClient);

  const schema = { ...getDbSchema(), ...customSchema };
  drizzleClient = drizzle(dbClient, { schema, logger: false });
  return drizzleClient;
};

export const getDb = () => {
  if (!drizzleClient) {
    throw new Error("Database client not initialized");
  }
  return drizzleClient;
};

export const createDatabaseTestingClient = async (usePool = false) => {
  console.log("create testing db client");
  if (usePool) {
    const pool = createPool();
    dbClient = await pool.connect();
  } else {
    const client = await createClient();
    await client.connect();
    dbClient = client;
  }
  console.log("client created");
  drizzleClient = drizzle(dbClient, { schema: getDbSchema(), logger: false });
  return drizzleClient;
};

export const waitForDbConnection = async () => {
  console.log("check db connection");
  while (!drizzleClient) {
    console.log("Waiting for database connection...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.log("db connection established");
};
