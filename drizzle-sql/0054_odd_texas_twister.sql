ALTER TABLE "base_secrets" DROP CONSTRAINT "base_secrets_reference_name_unique";--> statement-breakpoint
ALTER TABLE "base_active_subscriptions" DROP CONSTRAINT "base_active_subscriptions_stripe_customer_id_plan_name_unique";--> statement-breakpoint
ALTER TABLE "base_prompt_snippets" DROP CONSTRAINT "base_prompt_snippets_name_category_unique";--> statement-breakpoint
ALTER TABLE "base_prompt_templates" DROP CONSTRAINT "base_prompt_templates_name_category_unique";--> statement-breakpoint
DROP INDEX "unique_category_name";--> statement-breakpoint
DROP INDEX "teams_name_idx";--> statement-breakpoint
DROP INDEX "knowledge_entry_filter_unique";--> statement-breakpoint
DROP INDEX "knowledge_source_plugin_external_id_idx";--> statement-breakpoint
ALTER TABLE "base_path_permissions" ADD CONSTRAINT "unique_category_name" UNIQUE("category","name");--> statement-breakpoint
ALTER TABLE "base_teams" ADD CONSTRAINT "teams_name_idx" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "base_secrets" ADD CONSTRAINT "secrets_reference_name_idx" UNIQUE("reference","name");--> statement-breakpoint
ALTER TABLE "base_active_subscriptions" ADD CONSTRAINT "stripeCustomerIdPlanName" UNIQUE("stripe_customer_id","plan_name");--> statement-breakpoint
ALTER TABLE "base_prompt_snippets" ADD CONSTRAINT "prompt_snippets_name_category_idx" UNIQUE("name","category");--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD CONSTRAINT "prompt_templates_name_category_idx" UNIQUE("name","category");--> statement-breakpoint
ALTER TABLE "base_knowledge_entry_filters" ADD CONSTRAINT "knowledge_entry_filter_unique" UNIQUE("knowledge_entry_id","knowledge_filter_id");--> statement-breakpoint
ALTER TABLE "base_knowledge_source" ADD CONSTRAINT "knowledge_source_plugin_external_id_idx" UNIQUE("plugin_id","external_id");