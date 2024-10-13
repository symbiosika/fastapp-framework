CREATE TABLE IF NOT EXISTS "base_prompt_template_placeholder_defaults" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_template_id" uuid NOT NULL,
	"prompt_template_placeholder_id" uuid NOT NULL,
	"lang_code" varchar(2),
	"value" text NOT NULL,
	CONSTRAINT "base_prompt_template_placeholder_defaults_prompt_template_id_prompt_template_placeholder_id_lang_code_unique" UNIQUE("prompt_template_id","prompt_template_placeholder_id","lang_code")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_prompt_template_placeholder_defaults" ADD CONSTRAINT "base_prompt_template_placeholder_defaults_prompt_template_id_base_prompt_templates_id_fk" FOREIGN KEY ("prompt_template_id") REFERENCES "public"."base_prompt_templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_prompt_template_placeholder_defaults" ADD CONSTRAINT "base_prompt_template_placeholder_defaults_prompt_template_placeholder_id_base_prompt_template_placeholders_id_fk" FOREIGN KEY ("prompt_template_placeholder_id") REFERENCES "public"."base_prompt_template_placeholders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_template_placeholder_defaults_lang_code_idx" ON "base_prompt_template_placeholder_defaults" USING btree ("lang_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_template_placeholder_defaults_prompt_template_id_idx" ON "base_prompt_template_placeholder_defaults" USING btree ("prompt_template_id");