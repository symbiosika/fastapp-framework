CREATE TABLE "base_knowledge_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"organisation_wide_access" boolean DEFAULT false NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_group_name_idx" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "base_knowledge_group_team_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_group_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_group_team_assignment_unique" UNIQUE("knowledge_group_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD COLUMN "knowledge_group_id" uuid;--> statement-breakpoint
ALTER TABLE "base_knowledge_group" ADD CONSTRAINT "base_knowledge_group_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_group" ADD CONSTRAINT "base_knowledge_group_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_group_team_assignments" ADD CONSTRAINT "base_knowledge_group_team_assignments_knowledge_group_id_base_knowledge_group_id_fk" FOREIGN KEY ("knowledge_group_id") REFERENCES "public"."base_knowledge_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_group_team_assignments" ADD CONSTRAINT "base_knowledge_group_team_assignments_team_id_base_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."base_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_group_organisation_id_idx" ON "base_knowledge_group" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "knowledge_group_team_assignment_knowledge_group_id_idx" ON "base_knowledge_group_team_assignments" USING btree ("knowledge_group_id");--> statement-breakpoint
CREATE INDEX "knowledge_group_team_assignment_team_id_idx" ON "base_knowledge_group_team_assignments" USING btree ("team_id");--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD CONSTRAINT "base_knowledge_entry_knowledge_group_id_base_knowledge_group_id_fk" FOREIGN KEY ("knowledge_group_id") REFERENCES "public"."base_knowledge_group"("id") ON DELETE cascade ON UPDATE no action;