ALTER TABLE "base_secrets" ALTER COLUMN "reference" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_secrets" ALTER COLUMN "reference_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "base_secrets" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_secrets" ALTER COLUMN "label" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_secrets" ALTER COLUMN "type" SET DATA TYPE varchar(255);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "secrets_type_idx" ON "base_secrets" USING btree ("type");