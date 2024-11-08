DROP INDEX IF EXISTS "idx";--> statement-breakpoint
DROP INDEX IF EXISTS "ref_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "ref_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "name_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "table_index";--> statement-breakpoint
DROP INDEX IF EXISTS "source_id_index";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magic_link_sessions_user_id_idx" ON "base_magic_link_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magic_link_sessions_expires_at_idx" ON "base_magic_link_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "base_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_expires_idx" ON "base_sessions" USING btree ("expires");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_groups_name_idx" ON "base_user_groups" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_groups_created_at_idx" ON "base_user_groups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "base_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "base_users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "base_users" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_verified_idx" ON "base_users" USING btree ("email_verified");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "secrets_idx" ON "base_secrets" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "secrets_ref_idx" ON "base_secrets" USING btree ("reference");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "secrets_ref_id_idx" ON "base_secrets" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "secrets_name_idx" ON "base_secrets" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embeddings_source_table_index" ON "base_embeddings" USING btree ("source_table");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embeddings_source_id_index" ON "base_embeddings" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embeddings_order_idx" ON "base_embeddings" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "active_subscriptions_status_idx" ON "base_active_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "active_subscriptions_created_at_idx" ON "base_active_subscriptions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "active_subscriptions_updated_at_idx" ON "base_active_subscriptions" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "active_subscriptions_cancel_at_period_end_idx" ON "base_active_subscriptions" USING btree ("cancel_at_period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "active_subscriptions_current_period_start_idx" ON "base_active_subscriptions" USING btree ("current_period_start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "active_subscriptions_current_period_end_idx" ON "base_active_subscriptions" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "active_subscriptions_user_id_idx" ON "base_active_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_group_idx" ON "base_products" USING btree ("group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_name_idx" ON "base_products" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_type_idx" ON "base_products" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchases_created_at_idx" ON "base_purchases" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchases_updated_at_idx" ON "base_purchases" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchases_user_id_idx" ON "base_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchases_status_idx" ON "base_purchases" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchases_type_idx" ON "base_purchases" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchases_used_idx" ON "base_purchases" USING btree ("used");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchases_product_name_idx" ON "base_purchases" USING btree ("product_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_data_created_at_idx" ON "base_app_specific_data" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_data_version_idx" ON "base_app_specific_data" USING btree ("version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_data_created_at_idx" ON "base_user_specific_data" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_data_version_idx" ON "base_user_specific_data" USING btree ("version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_chunks_knowledge_entry_id_idx" ON "base_knowledge_chunks" USING btree ("knowledge_entry_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_chunks_created_at_idx" ON "base_knowledge_chunks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_chunks_header_idx" ON "base_knowledge_chunks" USING btree ("header");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_text_created_at_idx" ON "base_knowledge_text" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_text_title_idx" ON "base_knowledge_text" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_created_at_idx" ON "base_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_user_id_idx" ON "base_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_status_idx" ON "base_jobs" USING btree ("status");