CREATE TABLE IF NOT EXISTS "data"."secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"reference_id" uuid NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "secrets_reference_name_unique" UNIQUE("reference","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data"."files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"bucket" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"file_type" varchar(255) NOT NULL,
	"extension" varchar(255) NOT NULL,
	"file" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx" ON "data"."secrets" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ref_idx" ON "data"."secrets" USING btree ("reference");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ref_id_idx" ON "data"."secrets" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "data"."secrets" USING btree ("name");