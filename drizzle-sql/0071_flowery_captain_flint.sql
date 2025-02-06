CREATE TYPE "public"."webhook_event" AS ENUM('chat-output');--> statement-breakpoint
CREATE TYPE "public"."webhook_type" AS ENUM('n8n');--> statement-breakpoint
CREATE TABLE "base_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "webhook_type" NOT NULL,
	"event" "webhook_event" NOT NULL,
	"webhook_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "base_webhooks" ADD CONSTRAINT "base_webhooks_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "webhooks_organisation_id_idx" ON "base_webhooks" USING btree ("organisation_id");