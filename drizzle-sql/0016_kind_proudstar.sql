DO $$ BEGIN
 CREATE TYPE "public"."job_status" AS ENUM('pending', 'running', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" text NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"result" jsonb,
	"error" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_jobs" ADD CONSTRAINT "base_jobs_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
