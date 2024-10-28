DROP INDEX IF EXISTS "file_source_type_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "knowledgeentry_name_idx" ON "base_knowledge_entry" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_entry_file_source_type_idx" ON "base_knowledge_entry" USING btree ("file_source_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledgeentry_category1_idx" ON "base_knowledge_entry" USING btree ("category1");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledgeentry_category2_idx" ON "base_knowledge_entry" USING btree ("category2");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledgeentry_category3_idx" ON "base_knowledge_entry" USING btree ("category3");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledgeentry_created_at_idx" ON "base_knowledge_entry" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledgeentry_updated_at_idx" ON "base_knowledge_entry" USING btree ("updated_at");