import { sql } from "drizzle-orm";
import {
    pgEnum,
    text,
    timestamp,
    uuid,
    jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { pgBaseTable } from ".";

export const jobStatusEnum = pgEnum("job_status", [
    "pending",
    "running",
    "completed",
    "failed",
]);

export type JobStatus = "pending" | "running" | "completed" | "failed";

export const jobs = pgBaseTable("jobs", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
        .references(() => users.id),
    type: text("type").notNull(),
    status: jobStatusEnum("status").notNull().default("pending"),
    metadata: jsonb("metadata"),
    result: jsonb("result"),
    error: jsonb("error"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const jobsRelations = relations(jobs, ({ one }) => ({
    user: one(users, {
        fields: [jobs.userId],
        references: [users.id],
    }),
}));

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;