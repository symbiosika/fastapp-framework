CREATE TABLE "base_prompt_template_knowledge_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_template_id" uuid NOT NULL,
	"knowledge_entry_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prompt_template_knowledge_entry_unique" UNIQUE("prompt_template_id","knowledge_entry_id")
);
--> statement-breakpoint
CREATE TABLE "base_prompt_template_knowledge_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_template_id" uuid NOT NULL,
	"knowledge_filter_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prompt_template_knowledge_filter_unique" UNIQUE("prompt_template_id","knowledge_filter_id")
);
--> statement-breakpoint
CREATE TABLE "base_prompt_template_knowledge_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_template_id" uuid NOT NULL,
	"knowledge_group_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prompt_template_knowledge_group_unique" UNIQUE("prompt_template_id","knowledge_group_id")
);
--> statement-breakpoint
ALTER TABLE "base_prompt_template_knowledge_entries" ADD CONSTRAINT "base_prompt_template_knowledge_entries_prompt_template_id_base_prompt_templates_id_fk" FOREIGN KEY ("prompt_template_id") REFERENCES "public"."base_prompt_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_prompt_template_knowledge_entries" ADD CONSTRAINT "base_prompt_template_knowledge_entries_knowledge_entry_id_base_knowledge_entry_id_fk" FOREIGN KEY ("knowledge_entry_id") REFERENCES "public"."base_knowledge_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_prompt_template_knowledge_filters" ADD CONSTRAINT "base_prompt_template_knowledge_filters_prompt_template_id_base_prompt_templates_id_fk" FOREIGN KEY ("prompt_template_id") REFERENCES "public"."base_prompt_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_prompt_template_knowledge_filters" ADD CONSTRAINT "base_prompt_template_knowledge_filters_knowledge_filter_id_base_knowledge_filters_id_fk" FOREIGN KEY ("knowledge_filter_id") REFERENCES "public"."base_knowledge_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_prompt_template_knowledge_groups" ADD CONSTRAINT "base_prompt_template_knowledge_groups_prompt_template_id_base_prompt_templates_id_fk" FOREIGN KEY ("prompt_template_id") REFERENCES "public"."base_prompt_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_prompt_template_knowledge_groups" ADD CONSTRAINT "base_prompt_template_knowledge_groups_knowledge_group_id_base_knowledge_group_id_fk" FOREIGN KEY ("knowledge_group_id") REFERENCES "public"."base_knowledge_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prompt_template_knowledge_entries_prompt_id_idx" ON "base_prompt_template_knowledge_entries" USING btree ("prompt_template_id");--> statement-breakpoint
CREATE INDEX "prompt_template_knowledge_entries_entry_id_idx" ON "base_prompt_template_knowledge_entries" USING btree ("knowledge_entry_id");--> statement-breakpoint
CREATE INDEX "prompt_template_knowledge_filters_prompt_id_idx" ON "base_prompt_template_knowledge_filters" USING btree ("prompt_template_id");--> statement-breakpoint
CREATE INDEX "prompt_template_knowledge_filters_filter_id_idx" ON "base_prompt_template_knowledge_filters" USING btree ("knowledge_filter_id");--> statement-breakpoint
CREATE INDEX "prompt_template_knowledge_groups_prompt_id_idx" ON "base_prompt_template_knowledge_groups" USING btree ("prompt_template_id");--> statement-breakpoint
CREATE INDEX "prompt_template_knowledge_groups_group_id_idx" ON "base_prompt_template_knowledge_groups" USING btree ("knowledge_group_id");