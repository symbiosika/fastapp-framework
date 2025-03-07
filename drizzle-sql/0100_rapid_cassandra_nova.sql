CREATE TYPE "public"."ai_provider_model_type" AS ENUM('text', 'image', 'audio');--> statement-breakpoint
CREATE TABLE "base_ai_provider_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_type" "ai_provider_model_type"[] NOT NULL,
	"output_type" "ai_provider_model_type"[] NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"max_tokens" integer NOT NULL,
	"max_output_tokens" integer NOT NULL,
	"endpoint" text NOT NULL,
	"hosting_origin" text NOT NULL,
	"uses_internet" boolean NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_provider_model_unique" UNIQUE("organisation_id","provider","model")
);
--> statement-breakpoint
ALTER TABLE "base_ai_provider_models" ADD CONSTRAINT "base_ai_provider_models_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_provider_models_organisation_id_idx" ON "base_ai_provider_models" USING btree ("organisation_id");