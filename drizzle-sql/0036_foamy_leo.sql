CREATE TYPE "public"."permission_type" AS ENUM('regex');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_group_permissions" (
	"group_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "base_group_permissions_group_id_permission_id_pk" PRIMARY KEY("group_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "base_path_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system" boolean DEFAULT false NOT NULL,
	"category" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "permission_type" DEFAULT 'regex' NOT NULL,
	"method" varchar(10) NOT NULL,
	"path_expression" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_group_permissions" ADD CONSTRAINT "base_group_permissions_group_id_base_user_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."base_user_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_group_permissions" ADD CONSTRAINT "base_group_permissions_permission_id_base_path_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."base_path_permissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_permissions_group_id_idx" ON "base_group_permissions" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_permissions_permission_id_idx" ON "base_group_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_category_name" ON "base_path_permissions" USING btree ("category","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "permissions_method_idx" ON "base_path_permissions" USING btree ("method");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "permissions_type_idx" ON "base_path_permissions" USING btree ("type");
--> statement-breakpoint
DO $$ BEGIN
INSERT INTO "base_user_groups" (name) VALUES ('Global-Admin');

WITH inserted_permissions AS (
    INSERT INTO "base_path_permissions" 
        (system, category, name, description, type, method, path_expression)
    VALUES 
        (true, 'godmode', 'GET', 'Administrator GET access to all paths', 'regex', 'GET', '.*'),
        (true, 'godmode', 'POST', 'Administrator POST access to all paths', 'regex', 'POST', '.*'),
        (true, 'godmode', 'PUT', 'Administrator PUT access to all paths', 'regex', 'PUT', '.*'),
        (true, 'godmode', 'DELETE', 'Administrator DELETE access to all paths', 'regex', 'DELETE', '.*'),
        (true, 'godmode', 'PATCH', 'Administrator PATCH access to all paths', 'regex', 'PATCH', '.*')
    RETURNING id
)
INSERT INTO "base_group_permissions" (group_id, permission_id)
SELECT g.id, p.id
FROM inserted_permissions p
CROSS JOIN (SELECT id FROM "base_user_groups" WHERE name = 'Global-Admin') g;
END $$;