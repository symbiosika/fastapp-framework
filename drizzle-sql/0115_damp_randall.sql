ALTER TABLE "base_knowledge_group" DROP CONSTRAINT "knowledge_group_name_idx";--> statement-breakpoint
CREATE INDEX "knowledge_group_user_id_idx" ON "base_knowledge_group" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "base_knowledge_group" ADD CONSTRAINT "knowledge_group_name_org_idx" UNIQUE("name","organisation_id");