CREATE TABLE IF NOT EXISTS "base_magic_link_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_magic_link_sessions" ADD CONSTRAINT "base_magic_link_sessions_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_token" ON "base_magic_link_sessions" USING btree ("token");