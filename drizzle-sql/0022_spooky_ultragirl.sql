ALTER TABLE "base_users" ADD COLUMN "is_email_verified" boolean NOT NULL DEFAULT false;--> statement-breakpoint
UPDATE "base_users" SET "is_email_verified" = TRUE;--> statement-breakpoint
ALTER TABLE "base_users" DROP COLUMN "email_verified";--> statement-breakpoint
ALTER TABLE "base_users" RENAME COLUMN "is_email_verified" TO "email_verified";