import { defineConfig } from "drizzle-kit";

const POSTGRES_DB = process.env.POSTGRES_DB ?? "";
const POSTGRES_USER = process.env.POSTGRES_USER ?? "";
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? "";
const POSTGRES_HOST = process.env.POSTGRES_HOST ?? "";
const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT ?? "5432");
const POSTGRES_CA = process.env.POSTGRES_CA ?? "";

if (!POSTGRES_CA) {
  throw new Error("POSTGRES_CA is not set");
}

const PREFIX = "base_";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/db-schema.ts",
  out: "./drizzle-sql",
  tablesFilter: PREFIX + "*",
  migrations: {
    table: `${PREFIX}migrations`,
  },
  dbCredentials: {
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    database: POSTGRES_DB,
    ssl: {
      rejectUnauthorized: false,
      ca: POSTGRES_CA,
    },
  },
});
