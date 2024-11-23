ALTER TABLE "base_knowledge_text" ALTER COLUMN "source" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ALTER COLUMN "source" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ADD COLUMN "source_id" varchar(255);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_text_source_id_idx" ON "base_knowledge_text" USING btree ("source_id");