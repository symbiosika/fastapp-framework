ALTER TABLE "base_knowledge_fine_tuning_data" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "base_knowledge_fine_tuning_data" ADD CONSTRAINT "base_knowledge_fine_tuning_data_workspace_id_base_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."base_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD CONSTRAINT "base_knowledge_entry_workspace_id_base_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."base_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ADD CONSTRAINT "base_knowledge_text_workspace_id_base_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."base_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_fine_tuning_entry_workspace_id_idx" ON "base_knowledge_fine_tuning_data" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_entry_workspace_id_idx" ON "base_knowledge_entry" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_text_workspace_id_idx" ON "base_knowledge_text" USING btree ("workspace_id");