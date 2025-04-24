ALTER TABLE "base_users" ADD COLUMN "phone_number" varchar(255);--> statement-breakpoint
ALTER TABLE "base_users" ADD COLUMN "phone_number_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "base_users" ADD COLUMN "phone_number_as_number" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_phone_number" ON "base_users" USING btree ("phone_number");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_phone_number_as_number" ON "base_users" USING btree ("phone_number_as_number");