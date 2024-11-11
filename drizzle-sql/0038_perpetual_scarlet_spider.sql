CREATE TABLE IF NOT EXISTS "base_prompt_snippets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"category" varchar(255) DEFAULT '' NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "base_prompt_snippets_name_category_unique" UNIQUE("name","category")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_prompt_snippets" ADD CONSTRAINT "base_prompt_snippets_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_snippets_name_idx" ON "base_prompt_snippets" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_snippets_category_idx" ON "base_prompt_snippets" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_snippets_user_id_idx" ON "base_prompt_snippets" USING btree ("user_id");