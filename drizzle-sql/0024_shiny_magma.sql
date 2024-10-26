ALTER TABLE "base_prompt_template_placeholders" ADD COLUMN "label" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD COLUMN "label" text DEFAULT '' NOT NULL;