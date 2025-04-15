CREATE TYPE "public"."user_provider" AS ENUM('local', 'google', 'microsoft');--> statement-breakpoint
ALTER TABLE "base_users" ADD COLUMN "provider" "user_provider" DEFAULT 'local' NOT NULL;