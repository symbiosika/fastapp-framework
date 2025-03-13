ALTER TYPE "public"."ai_provider_model_type" ADD VALUE 'embedding';--> statement-breakpoint
ALTER TABLE "base_ai_provider_models" ADD COLUMN "show_info_banner" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "base_ai_provider_models" ADD COLUMN "info_banner_text" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "base_ai_provider_models" ADD COLUMN "info_banner_color" varchar(255) DEFAULT 'green' NOT NULL;