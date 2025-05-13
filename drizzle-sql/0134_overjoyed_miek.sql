ALTER TABLE "base_ai_provider_models" ADD COLUMN "show_for_user" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "base_ai_provider_models" ADD COLUMN "supports_tool_calling" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "base_ai_provider_models" ADD COLUMN "supports_streaming" boolean DEFAULT false NOT NULL;