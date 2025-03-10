CREATE TABLE "base_api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"organisation_id" uuid NOT NULL,
	"scopes" jsonb NOT NULL,
	"last_used" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_tokens_token_idx" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "base_api_tokens" ADD CONSTRAINT "base_api_tokens_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_api_tokens" ADD CONSTRAINT "base_api_tokens_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_tokens_user_id_idx" ON "base_api_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_tokens_organisation_id_idx" ON "base_api_tokens" USING btree ("organisation_id");