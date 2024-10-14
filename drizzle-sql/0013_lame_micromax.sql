ALTER TABLE "base_prompt_templates" ALTER COLUMN "type" SET DEFAULT '';--> statement-breakpoint
UPDATE "base_prompt_templates" SET "type" = '' WHERE "type" IS NULL;
ALTER TABLE "base_prompt_templates" ALTER COLUMN "type" SET NOT NULL;