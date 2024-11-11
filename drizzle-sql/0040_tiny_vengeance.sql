DROP INDEX IF EXISTS "teams_name_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "teams_name_idx" ON "base_teams" USING btree ("name");