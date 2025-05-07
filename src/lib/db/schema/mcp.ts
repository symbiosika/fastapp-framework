import { text, timestamp, uuid, index, pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organisations, users } from "./users";
import { pgBaseTable } from ".";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-valibot";

export const mcpServers = pgBaseTable(
  "mcp_servers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    name: text("name").notNull(),
    baseUrl: text("base_url").notNull(),
    clientId: text("client_id").notNull(),
    clientSecret: text("client_secret").notNull(),
    authorizeUrl: text("authorize_url").notNull(),
    tokenUrl: text("token_url").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("mcp_servers_created_at_idx").on(t.createdAt),
    index("mcp_servers_user_id_idx").on(t.userId),
  ]
);

export type MCPServerSelect = typeof mcpServers.$inferSelect;
export type MCPServerInsert = typeof mcpServers.$inferInsert;

export const mcpServerRelations = relations(mcpServers, ({ one }) => ({
  user: one(users, {
    fields: [mcpServers.userId],
    references: [users.id],
  }),
}));

export const mcpServerSelectSchema = createSelectSchema(mcpServers);
export const mcpServerInsertSchema = createInsertSchema(mcpServers);
export const mcpServerUpdateSchema = createUpdateSchema(mcpServers);

export const mcpTokens = pgBaseTable(
  "mcp_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    mcpServerId: uuid("mcp_server_id")
      .notNull()
      .references(() => mcpServers.id),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at"),
    scope: text("scope"),
    tokenType: text("token_type"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("mcp_tokens_created_at_idx").on(t.createdAt),
    index("mcp_tokens_user_id_idx").on(t.userId),
    index("mcp_tokens_mcp_server_id_idx").on(t.mcpServerId),
  ]
);

export type MCPServerTokenSelect = typeof mcpTokens.$inferSelect;
export type MCPServerTokenInsert = typeof mcpTokens.$inferInsert;

export const mcpServerTokenRelations = relations(mcpTokens, ({ one }) => ({
  mcpServer: one(mcpServers, {
    fields: [mcpTokens.mcpServerId],
    references: [mcpServers.id],
  }),
}));

export const mcpServerTokenSelectSchema = createSelectSchema(mcpTokens);
export const mcpServerTokenInsertSchema = createInsertSchema(mcpTokens);
export const mcpServerTokenUpdateSchema = createUpdateSchema(mcpTokens);
