ALTER TABLE "base_files" ADD COLUMN "chat_id" text;--> statement-breakpoint
ALTER TABLE "base_files" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD COLUMN "llm_options" jsonb;--> statement-breakpoint
ALTER TABLE "base_files" ADD CONSTRAINT "base_files_chat_id_base_chat_sessions_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."base_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_files" ADD CONSTRAINT "base_files_workspace_id_base_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."base_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "files_chat_id_idx" ON "base_files" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "files_workspace_id_idx" ON "base_files" USING btree ("workspace_id");