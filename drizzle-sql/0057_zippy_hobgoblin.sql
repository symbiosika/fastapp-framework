ALTER TABLE "base_user_groups" RENAME TO "base_user_permission_groups";--> statement-breakpoint
ALTER TABLE "base_group_permissions" DROP CONSTRAINT "base_group_permissions_group_id_base_user_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "base_user_group_members" DROP CONSTRAINT "base_user_group_members_user_groups_id_base_user_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "base_user_permission_groups" DROP CONSTRAINT "base_user_groups_organisation_id_base_organisations_id_fk";
--> statement-breakpoint
DROP INDEX "user_groups_name_idx";--> statement-breakpoint
DROP INDEX "user_groups_created_at_idx";--> statement-breakpoint
ALTER TABLE "base_group_permissions" ADD CONSTRAINT "base_group_permissions_group_id_base_user_permission_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."base_user_permission_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_user_group_members" ADD CONSTRAINT "base_user_group_members_user_groups_id_base_user_permission_groups_id_fk" FOREIGN KEY ("user_groups_id") REFERENCES "public"."base_user_permission_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_user_permission_groups" ADD CONSTRAINT "base_user_permission_groups_organisation_id_base_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."base_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_permission_groups_name_idx" ON "base_user_permission_groups" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_permission_groups_created_at_idx" ON "base_user_permission_groups" USING btree ("created_at");