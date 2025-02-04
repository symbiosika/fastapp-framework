CREATE TABLE "base_workspace_chat_groups" (
	"workspace_id" uuid NOT NULL,
	"chat_group_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_chat_group_unique" UNIQUE("workspace_id","chat_group_id")
);
--> statement-breakpoint
CREATE TABLE "base_workspace_chat_sessions" (
	"workspace_id" uuid NOT NULL,
	"chat_session_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_chat_session_unique" UNIQUE("workspace_id","chat_session_id")
);
--> statement-breakpoint
CREATE TABLE "base_workspace_knowledge_entries" (
	"workspace_id" uuid NOT NULL,
	"knowledge_entry_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_knowledge_entry_unique" UNIQUE("workspace_id","knowledge_entry_id")
);
--> statement-breakpoint
CREATE TABLE "base_workspace_knowledge_texts" (
	"workspace_id" uuid NOT NULL,
	"knowledge_text_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_knowledge_text_unique" UNIQUE("workspace_id","knowledge_text_id")
);
--> statement-breakpoint
CREATE TABLE "base_workspace_prompt_templates" (
	"workspace_id" uuid NOT NULL,
	"prompt_template_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_prompt_template_unique" UNIQUE("workspace_id","prompt_template_id")
);
--> statement-breakpoint
CREATE TABLE "base_workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_id" uuid,
	"team_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_name_org_user_unique" UNIQUE("name","organisation_id","user_id"),
	CONSTRAINT "workspace_name_org_team_unique" UNIQUE("name","organisation_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "base_workspace_chat_groups" ADD CONSTRAINT "base_workspace_chat_groups_workspace_id_base_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."base_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspace_chat_groups" ADD CONSTRAINT "base_workspace_chat_groups_chat_group_id_base_chat_session_groups_id_fk" FOREIGN KEY ("chat_group_id") REFERENCES "public"."base_chat_session_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspace_chat_sessions" ADD CONSTRAINT "base_workspace_chat_sessions_workspace_id_base_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."base_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspace_chat_sessions" ADD CONSTRAINT "base_workspace_chat_sessions_chat_session_id_base_chat_sessions_id_fk" FOREIGN KEY ("chat_session_id") REFERENCES "public"."base_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspace_knowledge_entries" ADD CONSTRAINT "base_workspace_knowledge_entries_workspace_id_base_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."base_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspace_knowledge_entries" ADD CONSTRAINT "base_workspace_knowledge_entries_knowledge_entry_id_base_knowledge_entry_id_fk" FOREIGN KEY ("knowledge_entry_id") REFERENCES "public"."base_knowledge_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspace_knowledge_texts" ADD CONSTRAINT "base_workspace_knowledge_texts_workspace_id_base_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."base_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspace_knowledge_texts" ADD CONSTRAINT "base_workspace_knowledge_texts_knowledge_text_id_base_knowledge_text_id_fk" FOREIGN KEY ("knowledge_text_id") REFERENCES "public"."base_knowledge_text"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspace_prompt_templates" ADD CONSTRAINT "base_workspace_prompt_templates_workspace_id_base_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."base_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspace_prompt_templates" ADD CONSTRAINT "base_workspace_prompt_templates_prompt_template_id_base_prompt_templates_id_fk" FOREIGN KEY ("prompt_template_id") REFERENCES "public"."base_prompt_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspaces" ADD CONSTRAINT "base_workspaces_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspaces" ADD CONSTRAINT "base_workspaces_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspaces" ADD CONSTRAINT "base_workspaces_team_id_base_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."base_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_chat_groups_workspace_idx" ON "base_workspace_chat_groups" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_chat_sessions_workspace_idx" ON "base_workspace_chat_sessions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_knowledge_entries_workspace_idx" ON "base_workspace_knowledge_entries" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_knowledge_texts_workspace_idx" ON "base_workspace_knowledge_texts" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_prompt_templates_workspace_idx" ON "base_workspace_prompt_templates" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_organisation_id_idx" ON "base_workspaces" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "workspace_user_id_idx" ON "base_workspaces" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_team_id_idx" ON "base_workspaces" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "workspace_created_at_idx" ON "base_workspaces" USING btree ("created_at");