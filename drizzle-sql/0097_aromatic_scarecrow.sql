ALTER TABLE "base_prompt_snippets" DROP CONSTRAINT "base_prompt_snippets_user_id_base_users_id_fk";
--> statement-breakpoint
ALTER TABLE "base_prompt_templates" DROP CONSTRAINT "base_prompt_templates_user_id_base_users_id_fk";
--> statement-breakpoint
ALTER TABLE "base_jobs" DROP CONSTRAINT "base_jobs_user_id_base_users_id_fk";
--> statement-breakpoint
ALTER TABLE "base_prompt_snippets" ADD CONSTRAINT "base_prompt_snippets_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_prompt_templates" ADD CONSTRAINT "base_prompt_templates_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_jobs" ADD CONSTRAINT "base_jobs_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;