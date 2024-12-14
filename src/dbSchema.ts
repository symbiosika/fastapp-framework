import { pgTableCreator } from "drizzle-orm/pg-core";
export * from "./lib/db/db-schema";

export const pgAppTable = pgTableCreator((name) => `app_${name}`);
