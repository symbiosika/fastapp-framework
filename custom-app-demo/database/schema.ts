import { varchar, uuid, timestamp, pgTableCreator } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
