CREATE TABLE "base_organisation_members" (
	"user_id" uuid NOT NULL,
	"organisation_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "base_organisation_members_user_id_organisation_id_pk" PRIMARY KEY("user_id","organisation_id")
);
--> statement-breakpoint
ALTER TABLE "base_users" DROP CONSTRAINT "base_users_organisation_id_base_organisations_id_fk";
--> statement-breakpoint
ALTER TABLE "base_users" ADD COLUMN "last_organisation_id" uuid;--> statement-breakpoint
ALTER TABLE "base_organisation_members" ADD CONSTRAINT "base_organisation_members_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_organisation_members" ADD CONSTRAINT "base_organisation_members_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organisation_members_user_id_idx" ON "base_organisation_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organisation_members_organisation_id_idx" ON "base_organisation_members" USING btree ("organisation_id");--> statement-breakpoint
ALTER TABLE "base_users" ADD CONSTRAINT "base_users_last_organisation_id_base_organisations_id_fk" FOREIGN KEY ("last_organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_users" DROP COLUMN "organisation_id";