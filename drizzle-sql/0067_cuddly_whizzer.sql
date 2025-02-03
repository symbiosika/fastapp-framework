CREATE TABLE "base_prompt_template_placeholder_examples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placeholder_id" uuid NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "base_prompt_template_placeholder_examples" ADD CONSTRAINT "base_prompt_template_placeholder_examples_placeholder_id_base_prompt_template_placeholders_id_fk" FOREIGN KEY ("placeholder_id") REFERENCES "public"."base_prompt_template_placeholders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placeholder_examples_placeholder_id_idx" ON "base_prompt_template_placeholder_examples" USING btree ("placeholder_id");