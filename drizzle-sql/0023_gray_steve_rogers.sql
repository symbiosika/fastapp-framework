ALTER TYPE "public"."file_source_type" ADD VALUE 'text';--> statement-breakpoint
ALTER TYPE "public"."file_source_type" ADD VALUE 'finetuning';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_knowledge_fine_tuning_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_entry_id" uuid NOT NULL,
	"name" varchar(255),
	"category" varchar(255),
	"question" text NOT NULL,
	"answer" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_knowledge_texts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD COLUMN "description" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_knowledge_fine_tuning_data" ADD CONSTRAINT "base_knowledge_fine_tuning_data_knowledge_entry_id_base_knowledge_entry_id_fk" FOREIGN KEY ("knowledge_entry_id") REFERENCES "public"."base_knowledge_entry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_entry_id_idx" ON "base_knowledge_fine_tuning_data" USING btree ("knowledge_entry_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_entry_name_idx" ON "base_knowledge_fine_tuning_data" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_entry_category_idx" ON "base_knowledge_fine_tuning_data" USING btree ("category");