ALTER TABLE "base_prompt_snippets" ADD COLUMN "organisation_wide" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "base_prompt_snippets" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ADD COLUMN "organisation_wide" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "base_prompt_snippets" ADD CONSTRAINT "base_prompt_snippets_team_id_base_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."base_teams"("id") ON DELETE cascade ON UPDATE no action;