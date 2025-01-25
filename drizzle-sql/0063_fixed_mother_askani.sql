CREATE TYPE "public"."team_member_role" AS ENUM('admin', 'member');--> statement-breakpoint
ALTER TABLE "base_team_members" ADD COLUMN "role" "team_member_role" DEFAULT 'member' NOT NULL;