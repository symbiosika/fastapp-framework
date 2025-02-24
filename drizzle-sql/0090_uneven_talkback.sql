CREATE TABLE "base_invitation_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"code" text NOT NULL,
	"organisation_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"max_uses" integer DEFAULT -1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "base_invitation_codes" ADD CONSTRAINT "base_invitation_codes_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_invitation_code" ON "base_invitation_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "invitation_codes_organisation_id_idx" ON "base_invitation_codes" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "invitation_codes_expires_at_idx" ON "base_invitation_codes" USING btree ("expires_at");