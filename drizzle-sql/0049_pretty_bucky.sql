ALTER TYPE "public"."file_source_type" ADD VALUE 'plugin';--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" RENAME COLUMN "file_source_type" TO "source_type";--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" RENAME COLUMN "file_source_id" TO "source_id";--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" RENAME COLUMN "file_source_bucket" TO "source_file_bucket";--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" RENAME COLUMN "file_source_url" TO "source_url";--> statement-breakpoint
DROP INDEX IF EXISTS "knowledge_entry_file_source_type_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_entry_file_source_type_idx" ON "base_knowledge_entry" USING btree ("source_type");