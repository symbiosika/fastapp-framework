CREATE TABLE IF NOT EXISTS "app_specific_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_specific_data_key_unique" UNIQUE("key"),
	CONSTRAINT "app_specific_data_key_name_unique" UNIQUE("key","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_specific_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" varchar(50) NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_specific_data_user_id_key_unique" UNIQUE("user_id","key")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_specific_data" ADD CONSTRAINT "user_specific_data_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_data_name_idx" ON "app_specific_data" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_data_key_idx" ON "app_specific_data" USING btree ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_data_type_idx" ON "user_specific_data" USING btree ("key");