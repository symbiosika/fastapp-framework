CREATE TABLE "base_organisation_specific_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "base_organisation_specific_data_category_name_unique" UNIQUE("category","name")
);
--> statement-breakpoint
CREATE INDEX "organisation_data_category_idx" ON "base_organisation_specific_data" USING btree ("category");--> statement-breakpoint
CREATE INDEX "organisation_data_name_idx" ON "base_organisation_specific_data" USING btree ("name");--> statement-breakpoint
CREATE INDEX "organisation_data_created_at_idx" ON "base_organisation_specific_data" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "organisation_data_version_idx" ON "base_organisation_specific_data" USING btree ("version");