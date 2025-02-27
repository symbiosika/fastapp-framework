ALTER TABLE "base_prompt_snippets" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_prompt_template_placeholders" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_prompt_template_placeholders" ALTER COLUMN "label" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_prompt_template_placeholders" ALTER COLUMN "description" SET DATA TYPE varchar(1000);--> statement-breakpoint

DELETE FROM "base_prompt_templates" WHERE "name" = '' OR "label" = '' OR "description" = '' OR "system_prompt" = '' OR length("system_prompt") > 10000 OR "user_prompt" = '' OR length("user_prompt") > 10000;--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ALTER COLUMN "label" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ALTER COLUMN "description" SET DATA TYPE varchar(1000);--> statement-breakpoint

DELETE FROM "base_prompt_snippets" WHERE "name" = '' OR "content" = '' OR "category" = '' OR length("content") > 10000;--> statement-breakpoint
ALTER TABLE "base_prompt_snippets" ADD CONSTRAINT "prompt_snippets_name_min_length" CHECK (length(name) > 0);--> statement-breakpoint
ALTER TABLE "base_prompt_snippets" ADD CONSTRAINT "prompt_snippets_content_min_length" CHECK (length(content) > 0);--> statement-breakpoint
ALTER TABLE "base_prompt_snippets" ADD CONSTRAINT "prompt_snippets_content_max_length" CHECK (length(content) <= 10000);--> statement-breakpoint
ALTER TABLE "base_prompt_template_placeholder_examples" ADD CONSTRAINT "prompt_template_placeholder_examples_value_min_length" CHECK (length(value) > 0);--> statement-breakpoint
ALTER TABLE "base_prompt_template_placeholder_examples" ADD CONSTRAINT "prompt_template_placeholder_examples_value_max_length" CHECK (length(value) <= 10000);--> statement-breakpoint
ALTER TABLE "base_prompt_template_placeholders" ADD CONSTRAINT "prompt_template_placeholders_name_min_length" CHECK (length(name) > 0);--> statement-breakpoint
ALTER TABLE "base_prompt_template_placeholders" ADD CONSTRAINT "prompt_template_placeholders_label_min_length" CHECK (length(label) > 0);--> statement-breakpoint
ALTER TABLE "base_prompt_template_placeholders" ADD CONSTRAINT "prompt_template_placeholders_description_max_length" CHECK (length(description) <= 10000);--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD CONSTRAINT "prompt_templates_name_min_length" CHECK (length(name) > 0);--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD CONSTRAINT "prompt_templates_category_min_length" CHECK (length(category) > 0);--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD CONSTRAINT "prompt_templates_system_prompt_min_length" CHECK (length(system_prompt) > 0);--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD CONSTRAINT "prompt_templates_system_prompt_max_length" CHECK (length(system_prompt) <= 10000);--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD CONSTRAINT "prompt_templates_user_prompt_max_length" CHECK (length(user_prompt) <= 10000);