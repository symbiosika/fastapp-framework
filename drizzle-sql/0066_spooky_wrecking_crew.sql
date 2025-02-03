DROP INDEX "knowledge_entry_id_idx";--> statement-breakpoint
DROP INDEX "knowledge_entry_name_idx";--> statement-breakpoint
DROP INDEX "knowledge_entry_category_idx";--> statement-breakpoint
DROP INDEX "knowledge_entry_organisation_id_idx";--> statement-breakpoint
ALTER TABLE "base_knowledge_fine_tuning_data" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "base_knowledge_fine_tuning_data" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "base_knowledge_fine_tuning_data" ADD CONSTRAINT "base_knowledge_fine_tuning_data_team_id_base_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."base_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_fine_tuning_data" ADD CONSTRAINT "base_knowledge_fine_tuning_data_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD CONSTRAINT "base_knowledge_entry_team_id_base_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."base_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD CONSTRAINT "base_knowledge_entry_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ADD CONSTRAINT "base_knowledge_text_team_id_base_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."base_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ADD CONSTRAINT "base_knowledge_text_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_fine_tuning_entry_id_idx" ON "base_knowledge_fine_tuning_data" USING btree ("knowledge_entry_id");--> statement-breakpoint
CREATE INDEX "knowledge_fine_tuning_entry_name_idx" ON "base_knowledge_fine_tuning_data" USING btree ("name");--> statement-breakpoint
CREATE INDEX "knowledge_fine_tuning_entry_category_idx" ON "base_knowledge_fine_tuning_data" USING btree ("category");--> statement-breakpoint
CREATE INDEX "knowledge_fine_tuning_entry_organisation_id_idx" ON "base_knowledge_fine_tuning_data" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "knowledge_fine_tuning_entry_team_id_idx" ON "base_knowledge_fine_tuning_data" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "knowledge_fine_tuning_entry_user_id_idx" ON "base_knowledge_fine_tuning_data" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "knowledge_entry_team_id_idx" ON "base_knowledge_entry" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "knowledge_entry_user_id_idx" ON "base_knowledge_entry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "knowledge_text_team_id_idx" ON "base_knowledge_text" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "knowledge_text_user_id_idx" ON "base_knowledge_text" USING btree ("user_id");