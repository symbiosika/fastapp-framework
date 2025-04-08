DELETE FROM "base_organisation_specific_data";
ALTER TABLE "base_organisation_specific_data" DROP CONSTRAINT "base_organisation_specific_data_category_name_unique";--> statement-breakpoint
ALTER TABLE "base_organisation_specific_data" ADD COLUMN "organisation_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "base_organisation_specific_data" ADD CONSTRAINT "base_organisation_specific_data_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_organisation_specific_data" ADD CONSTRAINT "base_organisation_specific_data_organisation_id_category_name_unique" UNIQUE("organisation_id","category","name");