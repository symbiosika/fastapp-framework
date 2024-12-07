CREATE TYPE "public"."log_level" AS ENUM('debug', 'info', 'warn', 'error');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_app_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" "log_level" NOT NULL,
	"source" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"session_id" uuid,
	"message" text NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_logs_level_idx" ON "base_app_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_logs_category_idx" ON "base_app_logs" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_logs_source_idx" ON "base_app_logs" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_logs_created_at_idx" ON "base_app_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_logs_version_idx" ON "base_app_logs" USING btree ("version");