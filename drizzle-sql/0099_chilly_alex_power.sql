ALTER TABLE "base_knowledge_source" DROP CONSTRAINT "base_knowledge_source_plugin_id_base_plugins_id_fk";
--> statement-breakpoint
ALTER TABLE "base_knowledge_source" ADD CONSTRAINT "base_knowledge_source_plugin_id_base_plugins_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."base_plugins"("id") ON DELETE cascade ON UPDATE no action;