ALTER TABLE "base_knowledge_entry_filters" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_filters_category_name_idx" ON "base_knowledge_filters" USING btree ("category","name");--> statement-breakpoint
ALTER TABLE "base_knowledge_entry_filters" DROP COLUMN IF EXISTS "value";