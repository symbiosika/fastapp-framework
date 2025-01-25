DELETE FROM "base_chat_sessions";--> statement-breakpoint
ALTER TABLE "base_chat_sessions" ADD COLUMN "organisation_id" uuid;--> statement-breakpoint
ALTER TABLE "base_chat_sessions" ADD CONSTRAINT "base_chat_sessions_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "base_team_members" DROP COLUMN "role";