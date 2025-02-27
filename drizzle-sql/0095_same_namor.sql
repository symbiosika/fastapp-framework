
DELETE FROM "base_knowledge_text" WHERE "text" = '' OR "text" IS NULL OR length("text") < 4;
ALTER TABLE "base_knowledge_chunks" ALTER COLUMN "header" SET DATA TYPE varchar(1000);--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ALTER COLUMN "source_file_bucket" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ALTER COLUMN "source_url" SET DATA TYPE varchar(1000);--> statement-breakpoint
ALTER TABLE "base_knowledge_source" ALTER COLUMN "last_hash" SET DATA TYPE varchar(1000);--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ALTER COLUMN "title" SET DATA TYPE varchar(1000);--> statement-breakpoint
ALTER TABLE "base_knowledge_fine_tuning_data" ADD CONSTRAINT "knowledge_fine_tuning_answer_max_length" CHECK (length(answer) <= 10000);--> statement-breakpoint
ALTER TABLE "base_knowledge_fine_tuning_data" ADD CONSTRAINT "knowledge_fine_tuning_question_max_length" CHECK (length(question) <= 10000);--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD CONSTRAINT "knowledge_entry_description_max_length" CHECK (length(description) <= 10000);--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ADD CONSTRAINT "knowledge_text_text_min_length" CHECK (length(text) > 3);