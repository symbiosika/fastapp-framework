-- Insert a new organization named "DEFAULT"
INSERT INTO base_organisations (name, created_at, updated_at)
VALUES ('DEFAULT', NOW(), NOW());
-- Get the ID of the newly created "DEFAULT" organization
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM base_organisations WHERE name = 'DEFAULT';
    -- Add all existing users to the DEFAULT organisation
    INSERT INTO base_organisation_members (user_id, organisation_id, role, joined_at)
    SELECT id, default_org_id, 'admin', NOW() FROM base_users;
    -- Update all users to set their last_organisation_id to the "DEFAULT" organization
    UPDATE base_users
    SET last_organisation_id = default_org_id;
END $$;--> statement-breakpoint

-- Add the column without NOT NULL constraint
ALTER TABLE "base_secrets" ADD COLUMN "organisation_id" uuid;
ALTER TABLE "base_files" ADD COLUMN "organisation_id" uuid;
ALTER TABLE "base_embeddings" ADD COLUMN "organisation_id" uuid;
ALTER TABLE "base_prompt_snippets" ADD COLUMN "organisation_id" uuid;
ALTER TABLE "base_prompt_templates" ADD COLUMN "organisation_id" uuid;
ALTER TABLE "base_knowledge_fine_tuning_data" ADD COLUMN "organisation_id" uuid;
ALTER TABLE "base_knowledge_entry" ADD COLUMN "organisation_id" uuid;
ALTER TABLE "base_knowledge_filters" ADD COLUMN "organisation_id" uuid;
ALTER TABLE "base_knowledge_text" ADD COLUMN "organisation_id" uuid;
ALTER TABLE "base_jobs" ADD COLUMN "organisation_id" uuid;
ALTER TABLE "base_plugins" ADD COLUMN "organisation_id" uuid;
ALTER TABLE "base_app_logs" ADD COLUMN "organisation_id" uuid;

-- Get the ID of the "DEFAULT" organization
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM base_organisations WHERE name = 'DEFAULT';

    -- Update tables with the DEFAULT organisation_id
    UPDATE base_secrets SET organisation_id = default_org_id;
    UPDATE base_files SET organisation_id = default_org_id;
    UPDATE base_embeddings SET organisation_id = default_org_id;
    UPDATE base_prompt_snippets SET organisation_id = default_org_id;
    UPDATE base_prompt_templates SET organisation_id = default_org_id;
    UPDATE base_knowledge_fine_tuning_data SET organisation_id = default_org_id;
    UPDATE base_knowledge_entry SET organisation_id = default_org_id;
    UPDATE base_knowledge_filters SET organisation_id = default_org_id;
    UPDATE base_knowledge_text SET organisation_id = default_org_id;
    UPDATE base_jobs SET organisation_id = default_org_id;
    UPDATE base_plugins SET organisation_id = default_org_id;
    UPDATE base_app_logs SET organisation_id = default_org_id;
END $$;

-- Add NOT NULL constraint after updating
ALTER TABLE "base_secrets" ALTER COLUMN "organisation_id" SET NOT NULL;
ALTER TABLE "base_files" ALTER COLUMN "organisation_id" SET NOT NULL;
ALTER TABLE "base_embeddings" ALTER COLUMN "organisation_id" SET NOT NULL;
ALTER TABLE "base_prompt_snippets" ALTER COLUMN "organisation_id" SET NOT NULL;
ALTER TABLE "base_prompt_templates" ALTER COLUMN "organisation_id" SET NOT NULL;
ALTER TABLE "base_knowledge_fine_tuning_data" ALTER COLUMN "organisation_id" SET NOT NULL;
ALTER TABLE "base_knowledge_entry" ALTER COLUMN "organisation_id" SET NOT NULL;
ALTER TABLE "base_knowledge_filters" ALTER COLUMN "organisation_id" SET NOT NULL;
ALTER TABLE "base_knowledge_text" ALTER COLUMN "organisation_id" SET NOT NULL;
ALTER TABLE "base_jobs" ALTER COLUMN "organisation_id" SET NOT NULL;
ALTER TABLE "base_plugins" ALTER COLUMN "organisation_id" SET NOT NULL;
ALTER TABLE "base_app_logs" ALTER COLUMN "organisation_id" SET NOT NULL;

ALTER TABLE "base_secrets" ADD CONSTRAINT "base_secrets_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_files" ADD CONSTRAINT "base_files_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_embeddings" ADD CONSTRAINT "base_embeddings_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_prompt_snippets" ADD CONSTRAINT "base_prompt_snippets_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD CONSTRAINT "base_prompt_templates_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_fine_tuning_data" ADD CONSTRAINT "base_knowledge_fine_tuning_data_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD CONSTRAINT "base_knowledge_entry_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_filters" ADD CONSTRAINT "base_knowledge_filters_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ADD CONSTRAINT "base_knowledge_text_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_jobs" ADD CONSTRAINT "base_jobs_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_plugins" ADD CONSTRAINT "base_plugins_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_app_logs" ADD CONSTRAINT "base_app_logs_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_entry_organisation_id_idx" ON "base_knowledge_fine_tuning_data" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "knowledgeentry_organisation_id_idx" ON "base_knowledge_entry" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "knowledge_text_organisation_id_idx" ON "base_knowledge_text" USING btree ("organisation_id");