ALTER TABLE "base_knowledge_fine_tuning_data" DROP CONSTRAINT "base_knowledge_fine_tuning_data_organisation_id_base_organisations_id_fk";
--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" DROP CONSTRAINT "base_knowledge_entry_organisation_id_base_organisations_id_fk";
--> statement-breakpoint
ALTER TABLE "base_knowledge_filters" DROP CONSTRAINT "base_knowledge_filters_organisation_id_base_organisations_id_fk";
--> statement-breakpoint
ALTER TABLE "base_knowledge_text" DROP CONSTRAINT "base_knowledge_text_organisation_id_base_organisations_id_fk";
--> statement-breakpoint
ALTER TABLE "base_knowledge_fine_tuning_data" ADD CONSTRAINT "base_knowledge_fine_tuning_data_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_entry" ADD CONSTRAINT "base_knowledge_entry_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_filters" ADD CONSTRAINT "base_knowledge_filters_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_knowledge_text" ADD CONSTRAINT "base_knowledge_text_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;