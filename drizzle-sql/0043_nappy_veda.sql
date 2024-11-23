CREATE TABLE IF NOT EXISTS "base_plugins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"plugin_type" text NOT NULL,
	"version" integer NOT NULL,
	"meta" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugins_name_idx" UNIQUE("name")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plugins_created_at_idx" ON "base_plugins" USING btree ("created_at");