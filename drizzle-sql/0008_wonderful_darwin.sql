DO $$ BEGIN
 CREATE TYPE "public"."prompt_template_type" AS ENUM('text', 'image');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_prompt_template_placeholders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_template_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" "prompt_template_type" DEFAULT 'text' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" varchar(255),
	"template" text NOT NULL,
	"lang_code" varchar(2),
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "base_prompt_templates_name_type_unique" UNIQUE("name","type")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_prompt_template_placeholders" ADD CONSTRAINT "base_prompt_template_placeholders_prompt_template_id_base_prompt_templates_id_fk" FOREIGN KEY ("prompt_template_id") REFERENCES "public"."base_prompt_templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_prompt_templates" ADD CONSTRAINT "base_prompt_templates_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_template_id_idx" ON "base_prompt_template_placeholders" USING btree ("prompt_template_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_templates_name_idx" ON "base_prompt_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_templates_type_idx" ON "base_prompt_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_templates_user_id_idx" ON "base_prompt_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_templates_lang_code_idx" ON "base_prompt_templates" USING btree ("lang_code");