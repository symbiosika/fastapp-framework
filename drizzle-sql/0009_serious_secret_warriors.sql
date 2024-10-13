ALTER TABLE "app_specific_data" RENAME TO "base_app_specific_data";--> statement-breakpoint
ALTER TABLE "user_specific_data" RENAME TO "base_user_specific_data";--> statement-breakpoint
ALTER TABLE "base_app_specific_data" DROP CONSTRAINT "app_specific_data_key_unique";--> statement-breakpoint
ALTER TABLE "base_app_specific_data" DROP CONSTRAINT "app_specific_data_key_name_unique";--> statement-breakpoint
ALTER TABLE "base_user_specific_data" DROP CONSTRAINT "user_specific_data_user_id_key_unique";--> statement-breakpoint
ALTER TABLE "base_user_specific_data" DROP CONSTRAINT "user_specific_data_user_id_base_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_user_specific_data" ADD CONSTRAINT "base_user_specific_data_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "base_app_specific_data" ADD CONSTRAINT "base_app_specific_data_key_unique" UNIQUE("key");--> statement-breakpoint
ALTER TABLE "base_app_specific_data" ADD CONSTRAINT "base_app_specific_data_key_name_unique" UNIQUE("key","name");--> statement-breakpoint
ALTER TABLE "base_user_specific_data" ADD CONSTRAINT "base_user_specific_data_user_id_key_unique" UNIQUE("user_id","key");