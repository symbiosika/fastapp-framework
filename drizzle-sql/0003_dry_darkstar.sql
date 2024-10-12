ALTER TABLE "base_one_time_purchases" RENAME TO "base_purchases";--> statement-breakpoint
ALTER TABLE "base_purchases" DROP CONSTRAINT "base_one_time_purchases_user_id_base_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "base_purchases" ADD CONSTRAINT "base_purchases_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
