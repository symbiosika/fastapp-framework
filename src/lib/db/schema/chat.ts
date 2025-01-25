import { text, timestamp, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { pgBaseTable } from ".";
import { sql } from "drizzle-orm";
import { organisations, users } from "./users";

export const chatSessions = pgBaseTable(
  "chat_sessions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    organisationId: uuid("organisation_id").references(() => organisations.id, {
      onDelete: "cascade",
    }),
    messages: jsonb("messages").notNull(),
    state: jsonb("state").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (chatSessions) => [
    index("chat_sessions_updated_at_idx").on(chatSessions.updatedAt),
  ]
);

export type ChatSessionsSelect = typeof chatSessions.$inferSelect;
export type ChatSessionsInsert = typeof chatSessions.$inferInsert;
export type ChatSessionsUpdate = Partial<ChatSessionsInsert>;
