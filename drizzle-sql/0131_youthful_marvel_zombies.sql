CREATE TABLE "base_mcp_servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organisation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"base_url" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text NOT NULL,
	"authorize_url" text NOT NULL,
	"token_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "base_mcp_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mcp_server_id" uuid NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"scope" text,
	"token_type" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "base_mcp_servers" ADD CONSTRAINT "base_mcp_servers_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_mcp_servers" ADD CONSTRAINT "base_mcp_servers_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_mcp_tokens" ADD CONSTRAINT "base_mcp_tokens_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_mcp_tokens" ADD CONSTRAINT "base_mcp_tokens_mcp_server_id_base_mcp_servers_id_fk" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."base_mcp_servers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mcp_servers_created_at_idx" ON "base_mcp_servers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "mcp_servers_user_id_idx" ON "base_mcp_servers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mcp_tokens_created_at_idx" ON "base_mcp_tokens" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "mcp_tokens_user_id_idx" ON "base_mcp_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mcp_tokens_mcp_server_id_idx" ON "base_mcp_tokens" USING btree ("mcp_server_id");