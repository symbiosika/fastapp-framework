ALTER TABLE "base_prompt_templates" RENAME COLUMN "type" TO "category";--> statement-breakpoint
ALTER TABLE "base_prompt_templates" DROP CONSTRAINT "base_prompt_templates_name_type_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "prompt_templates_type_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_templates_type_idx" ON "base_prompt_templates" USING btree ("category");--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD CONSTRAINT "base_prompt_templates_name_category_unique" UNIQUE("name","category");