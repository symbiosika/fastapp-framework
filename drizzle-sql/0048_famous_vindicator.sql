CREATE TABLE IF NOT EXISTS "base_knowledge_source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plugin_id" uuid NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"last_synced" timestamp,
	"last_hash" text,
	"last_change" timestamp,
	"knowledge_entry_id" uuid NOT NULL,
	"meta" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_knowledge_source" ADD CONSTRAINT "base_knowledge_source_plugin_id_base_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."base_plugins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_knowledge_source" ADD CONSTRAINT "base_knowledge_source_knowledge_entry_id_base_knowledge_entry_id_fk" FOREIGN KEY ("knowledge_entry_id") REFERENCES "public"."base_knowledge_entry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_source_plugin_external_id_idx" ON "base_knowledge_source" USING btree ("plugin_id","external_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_source_entry_id_idx" ON "base_knowledge_source" USING btree ("knowledge_entry_id");