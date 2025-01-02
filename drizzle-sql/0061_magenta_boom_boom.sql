CREATE TABLE "base_team_specific_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"category" varchar(100) NOT NULL,
	"key" varchar(50) NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "base_team_specific_data_team_id_category_key_unique" UNIQUE("team_id","category","key")
);
--> statement-breakpoint
ALTER TABLE "base_team_specific_data" ADD CONSTRAINT "base_team_specific_data_team_id_base_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."base_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_data_key_idx" ON "base_team_specific_data" USING btree ("key");--> statement-breakpoint
CREATE INDEX "team_data_created_at_idx" ON "base_team_specific_data" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "team_data_version_idx" ON "base_team_specific_data" USING btree ("version");