ALTER TABLE "base_webhooks" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "base_webhooks" ALTER COLUMN "event" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "base_webhooks" ADD COLUMN "method" text DEFAULT 'POST' NOT NULL;--> statement-breakpoint
ALTER TABLE "base_webhooks" ADD COLUMN "headers" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "base_webhooks" ADD COLUMN "meta" jsonb DEFAULT '{}'::jsonb;