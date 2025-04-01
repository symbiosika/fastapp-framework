ALTER TABLE "base_prompt_templates" DROP CONSTRAINT "prompt_templates_system_prompt_max_length";--> statement-breakpoint
ALTER TABLE "base_prompt_templates" DROP CONSTRAINT "prompt_templates_user_prompt_max_length";--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD CONSTRAINT "prompt_templates_system_prompt_max_length" CHECK (length(system_prompt) <= 50000);--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD CONSTRAINT "prompt_templates_user_prompt_max_length" CHECK (length(user_prompt) <= 50000);