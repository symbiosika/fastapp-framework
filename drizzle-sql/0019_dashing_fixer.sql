DROP INDEX IF EXISTS "unique_ext_user_id";--> statement-breakpoint
ALTER TABLE "base_users" ALTER COLUMN "ext_user_id" SET DEFAULT '';