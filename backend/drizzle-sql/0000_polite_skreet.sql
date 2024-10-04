CREATE TABLE IF NOT EXISTS "base_sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_user_group_members" (
	"user_id" uuid NOT NULL,
	"user_groups_id" uuid NOT NULL,
	CONSTRAINT "base_user_group_members_user_id_user_groups_id_pk" PRIMARY KEY("user_id","user_groups_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_user_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"password" text,
	"salt" text,
	"image" text,
	"firstname" varchar(255) NOT NULL,
	"surname" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ext_user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"reference_id" uuid NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "base_secrets_reference_name_unique" UNIQUE("reference","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_files" (
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
DO $$ BEGIN
 ALTER TABLE "base_sessions" ADD CONSTRAINT "base_sessions_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_user_group_members" ADD CONSTRAINT "base_user_group_members_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_user_group_members" ADD CONSTRAINT "base_user_group_members_user_groups_id_base_user_groups_id_fk" FOREIGN KEY ("user_groups_id") REFERENCES "public"."base_user_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx" ON "base_secrets" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ref_idx" ON "base_secrets" USING btree ("reference");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ref_id_idx" ON "base_secrets" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "base_secrets" USING btree ("name");