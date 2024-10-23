ALTER TABLE "base_files" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "base_prompt_template_placeholders" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;