ALTER TABLE "base_mcp_servers" RENAME COLUMN "base_url" TO "mcp_server_url";--> statement-breakpoint
ALTER TABLE "base_mcp_servers" DROP COLUMN "authorize_url";--> statement-breakpoint
ALTER TABLE "base_mcp_servers" DROP COLUMN "token_url";