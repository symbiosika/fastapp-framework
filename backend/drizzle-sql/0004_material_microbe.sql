DO $$ BEGIN
 CREATE TYPE "public"."purchase_type" AS ENUM('purchase', 'subscription');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "base_active_subscriptions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "base_purchases" ADD COLUMN "type" "purchase_type" NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stripe_customer_id_plan_name_index" ON "base_active_subscriptions" USING btree ("stripe_customer_id","plan_name");--> statement-breakpoint
ALTER TABLE "base_active_subscriptions" ADD CONSTRAINT "base_active_subscriptions_stripe_customer_id_plan_name_unique" UNIQUE("stripe_customer_id","plan_name");