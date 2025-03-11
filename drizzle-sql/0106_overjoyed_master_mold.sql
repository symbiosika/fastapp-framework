DROP INDEX "knowledgeentry_name_idx";--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD COLUMN "parentId" uuid;--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD COLUMN "version_text" text DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD CONSTRAINT "base_knowledge_entry_parentId_base_knowledge_entry_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."base_knowledge_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "knowledgeentry_name_idx" ON "base_knowledge_entry" USING btree ("name","parentId","organisation_id","team_id","user_id","workspace_id","version");