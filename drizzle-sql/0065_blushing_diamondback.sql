CREATE TABLE "base_chat_session_group_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_session_group_id" uuid NOT NULL,
	"user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "base_chat_session_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"meta" jsonb,
	"organisation_id" uuid NOT NULL,
	"team_id" uuid,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "base_chat_sessions" ADD COLUMN "chat_session_group_id" uuid;--> statement-breakpoint
ALTER TABLE "base_chat_sessions" ADD COLUMN "delete_at" timestamp;--> statement-breakpoint
ALTER TABLE "base_chat_session_group_assignments" ADD CONSTRAINT "base_chat_session_group_assignments_chat_session_group_id_base_chat_session_groups_id_fk" FOREIGN KEY ("chat_session_group_id") REFERENCES "public"."base_chat_session_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_chat_session_group_assignments" ADD CONSTRAINT "base_chat_session_group_assignments_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_chat_session_groups" ADD CONSTRAINT "base_chat_session_groups_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_chat_session_groups" ADD CONSTRAINT "base_chat_session_groups_team_id_base_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."base_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_session_group_assignments_chat_session_group_id_idx" ON "base_chat_session_group_assignments" USING btree ("chat_session_group_id");--> statement-breakpoint
CREATE INDEX "chat_session_group_assignments_user_id_idx" ON "base_chat_session_group_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_session_groups_organisation_id_idx" ON "base_chat_session_groups" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "chat_session_groups_team_id_idx" ON "base_chat_session_groups" USING btree ("team_id");--> statement-breakpoint
ALTER TABLE "base_chat_sessions" ADD CONSTRAINT "base_chat_sessions_chat_session_group_id_base_chat_session_groups_id_fk" FOREIGN KEY ("chat_session_group_id") REFERENCES "public"."base_chat_session_groups"("id") ON DELETE cascade ON UPDATE no action;