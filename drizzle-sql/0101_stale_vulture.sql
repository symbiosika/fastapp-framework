ALTER TABLE "base_ai_provider_models" ALTER COLUMN "provider" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_ai_provider_models" ALTER COLUMN "model" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_ai_provider_models" ALTER COLUMN "label" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_ai_provider_models" ALTER COLUMN "description" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_ai_provider_models" ALTER COLUMN "endpoint" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_ai_provider_models" ALTER COLUMN "hosting_origin" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_ai_provider_models" ADD COLUMN "name" varchar(255) NOT NULL;