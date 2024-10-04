// App variables
import { createDbClient } from "./fastapp.db";
import type { FastAppHono } from "./fastapp.types";
// Drizzle
import { varchar, uuid, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { pgTableCreator } from "drizzle-orm/pg-core";
export const pgCustomAppTable = pgTableCreator((name) => `custom_demo_${name}`);

// Drizzle tables schema
export const demoData = pgCustomAppTable("demo_data", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
  value: varchar("value", { length: 255 }).notNull(),
});

const demoDbSchema = {
  demoData,
};

// hold the connection
let dbClient = await createDbClient(demoDbSchema);

export const getDb = () => {
  return dbClient;
};

const db = dbClient;
export type AppDbWithSchema = typeof db;

// this function will be ankered to /api/v1/custom/test:
export default function defineRoutes(app: FastAppHono) {
  app.get("/test", async (c) => {
    const usersEmail = c.get("usersEmail");

    // insert a random value into the database
    const randomValue = Math.random().toString(36).substring(2, 15);
    await db.insert(demoData).values({ value: randomValue });
    // select top 5 values from the database
    const top5Values = await db.select().from(demoData).limit(5);

    return c.json({
      usersEmail,
      top5Values,
    });
  });
}
