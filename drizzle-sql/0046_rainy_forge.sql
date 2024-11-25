CREATE TABLE IF NOT EXISTS "base_knowledge_entry_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_entry_id" uuid NOT NULL,
	"knowledge_filter_id" uuid NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_knowledge_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS "knowledgeentry_category1_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "knowledgeentry_category2_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "knowledgeentry_category3_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "knowledge_text_source_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "knowledge_text_source_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "knowledge_text_source_and_source_id_unique";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_knowledge_entry_filters" ADD CONSTRAINT "base_knowledge_entry_filters_knowledge_entry_id_base_knowledge_entry_id_fk" FOREIGN KEY ("knowledge_entry_id") REFERENCES "public"."base_knowledge_entry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_knowledge_entry_filters" ADD CONSTRAINT "base_knowledge_entry_filters_knowledge_filter_id_base_knowledge_filters_id_fk" FOREIGN KEY ("knowledge_filter_id") REFERENCES "public"."base_knowledge_filters"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_entry_filter_unique" ON "base_knowledge_entry_filters" USING btree ("knowledge_entry_id","knowledge_filter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_entry_filters_entry_id_idx" ON "base_knowledge_entry_filters" USING btree ("knowledge_entry_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_entry_filters_filter_id_idx" ON "base_knowledge_entry_filters" USING btree ("knowledge_filter_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_filters_name_type_unique" ON "base_knowledge_filters" USING btree ("name","category");--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" DROP COLUMN IF EXISTS "category1";--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" DROP COLUMN IF EXISTS "category2";--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" DROP COLUMN IF EXISTS "category3";--> statement-breakpoint
ALTER TABLE "base_knowledge_text" DROP COLUMN IF EXISTS "source";--> statement-breakpoint
ALTER TABLE "base_knowledge_text" DROP COLUMN IF EXISTS "source_id";