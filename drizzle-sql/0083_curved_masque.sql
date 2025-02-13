CREATE TABLE "base_workspace_users" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_user_unique" UNIQUE("workspace_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "base_workspaces" ADD COLUMN "result" jsonb;--> statement-breakpoint
ALTER TABLE "base_workspaces" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
ALTER TABLE "base_workspace_users" ADD CONSTRAINT "base_workspace_users_workspace_id_base_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."base_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_workspace_users" ADD CONSTRAINT "base_workspace_users_user_id_base_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_users_workspace_idx" ON "base_workspace_users" USING btree ("workspace_id");