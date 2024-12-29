CREATE TABLE "base_organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organisations_name_idx" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "base_path_permissions" ADD COLUMN "organisation_id" uuid;--> statement-breakpoint
ALTER TABLE "base_teams" ADD COLUMN "organisation_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "base_user_groups" ADD COLUMN "organisation_id" uuid;--> statement-breakpoint
ALTER TABLE "base_users" ADD COLUMN "organisation_id" uuid;--> statement-breakpoint
ALTER TABLE "base_path_permissions" ADD CONSTRAINT "base_path_permissions_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_teams" ADD CONSTRAINT "base_teams_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_user_groups" ADD CONSTRAINT "base_user_groups_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_users" ADD CONSTRAINT "base_users_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;