ALTER TABLE "base_app_specific_data" DROP CONSTRAINT "base_app_specific_data_key_name_unique";--> statement-breakpoint
ALTER TABLE "base_organisation_specific_data" DROP CONSTRAINT "base_organisation_specific_data_organisation_id_category_name_unique";--> statement-breakpoint
ALTER TABLE "base_team_specific_data" DROP CONSTRAINT "base_team_specific_data_team_id_category_key_unique";--> statement-breakpoint
DROP INDEX "app_data_name_idx";--> statement-breakpoint
DROP INDEX "app_data_key_idx";--> statement-breakpoint
DROP INDEX "organisation_data_category_idx";--> statement-breakpoint
DROP INDEX "organisation_data_name_idx";--> statement-breakpoint
CREATE INDEX "organisation_data_key_idx" ON "base_organisation_specific_data" USING btree ("category");--> statement-breakpoint
ALTER TABLE "base_app_specific_data" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "base_organisation_specific_data" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "base_team_specific_data" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "base_organisation_specific_data" ADD CONSTRAINT "base_organisation_specific_data_organisation_id_category_unique" UNIQUE("organisation_id","category");--> statement-breakpoint
ALTER TABLE "base_team_specific_data" ADD CONSTRAINT "base_team_specific_data_team_id_key_unique" UNIQUE("team_id","key");