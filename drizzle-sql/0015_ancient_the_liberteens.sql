DO $$ BEGIN
 CREATE TYPE "public"."file_source_type" AS ENUM('db', 'local', 'url');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_knowledge_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_entry_id" uuid NOT NULL,
	"text" text NOT NULL,
	"header" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"embedding_model" varchar(255) DEFAULT '' NOT NULL,
	"text_embedding" vector(1536) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_knowledge_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_source_type" "file_source_type" NOT NULL,
	"file_source_id" uuid,
	"file_source_bucket" text,
	"file_source_url" text,
	"title" varchar(1000) NOT NULL,
	"abstract" text,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "base_embeddings" ALTER COLUMN "section" SET DATA TYPE varchar(1000);--> statement-breakpoint
ALTER TABLE "base_embeddings" ADD COLUMN "meta" jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_knowledge_chunks" ADD CONSTRAINT "base_knowledge_chunks_knowledge_entry_id_base_knowledge_entry_id_fk" FOREIGN KEY ("knowledge_entry_id") REFERENCES "public"."base_knowledge_entry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
