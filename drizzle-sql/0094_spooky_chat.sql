DELETE FROM "base_chat_session_groups" WHERE "name" = '' OR "name" IS NULL;--> statement-breakpoint
ALTER TABLE "base_chat_session_groups" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
DELETE FROM "base_chat_sessions" WHERE "name" = '' OR "name" IS NULL;--> statement-breakpoint
ALTER TABLE "base_chat_sessions" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_chat_session_groups" ADD CONSTRAINT "chat_session_groups_name_min_length" CHECK (length("name") >= 1);--> statement-breakpoint
ALTER TABLE "base_chat_sessions" ADD CONSTRAINT "chat_sessions_name_min_length" CHECK (length("name") >= 1);