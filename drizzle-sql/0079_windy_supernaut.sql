ALTER TABLE "base_prompt_templates" RENAME COLUMN "template" TO "system_prompt";--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD COLUMN "user_prompt" text;