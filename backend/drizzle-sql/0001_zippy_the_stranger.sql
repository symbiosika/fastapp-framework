CREATE TABLE IF NOT EXISTS "base_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_table" varchar(255) NOT NULL,
	"source_id" uuid NOT NULL,
	"order_number" integer DEFAULT 0 NOT NULL,
	"section" varchar(255) DEFAULT '' NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"embedding_model" varchar(255) DEFAULT '' NOT NULL,
	"text_embedding" vector(1536) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "table_index" ON "base_embeddings" USING btree ("source_table");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "source_id_index" ON "base_embeddings" USING btree ("source_id");