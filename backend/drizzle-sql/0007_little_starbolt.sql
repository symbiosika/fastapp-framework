CREATE TABLE IF NOT EXISTS "base_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "purchase_type" NOT NULL,
	"prod_id" text NOT NULL,
	"price_id" text NOT NULL
);
