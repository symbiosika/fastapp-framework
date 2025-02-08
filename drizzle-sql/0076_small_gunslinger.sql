ALTER TABLE "base_webhooks" ALTER COLUMN "headers" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_webhooks" ALTER COLUMN "meta" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "base_chat_sessions" ADD COLUMN "last_used_at" timestamp DEFAULT now() NOT NULL;