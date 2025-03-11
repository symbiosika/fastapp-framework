ALTER TABLE "base_app_logs" ALTER COLUMN "organisation_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_knowledge_chunks" ADD COLUMN "meta" jsonb DEFAULT '{}'::jsonb;