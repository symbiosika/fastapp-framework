CREATE TABLE IF NOT EXISTS "custom_demo_demo_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"value" varchar(255) NOT NULL
);
