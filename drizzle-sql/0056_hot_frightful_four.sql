CREATE TYPE "public"."organisation_invitation_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "base_organisation_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"organisation_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "base_organisation_invitations" ADD CONSTRAINT "base_organisation_invitations_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_invitation" ON "base_organisation_invitations" USING btree ("email","organisation_id");--> statement-breakpoint
CREATE INDEX "invitations_status_idx" ON "base_organisation_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invitations_created_at_idx" ON "base_organisation_invitations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "base_organisation_invitations" USING btree ("email");