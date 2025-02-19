ALTER TABLE "base_knowledge_entry" ALTER COLUMN "meta" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "base_webhooks" ADD COLUMN "organisation_wide" boolean DEFAULT false NOT NULL;