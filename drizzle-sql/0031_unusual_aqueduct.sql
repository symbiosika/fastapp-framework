CREATE INDEX IF NOT EXISTS "files_id_idx" ON "base_files" USING btree ("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_bucket_name_idx" ON "base_files" USING btree ("bucket");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_created_at_idx" ON "base_files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_updated_at_idx" ON "base_files" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_name_idx" ON "base_files" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_expires_at_idx" ON "base_files" USING btree ("expires_at");