ALTER TABLE "base_organisation_members" DROP COLUMN "role";--> statement-breakpoint
CREATE TYPE "public"."organisation_member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
ALTER TABLE "base_organisation_members" ADD COLUMN "role" organisation_member_role NOT NULL DEFAULT 'member';