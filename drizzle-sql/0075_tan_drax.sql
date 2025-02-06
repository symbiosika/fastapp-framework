CREATE TYPE "public"."webhook_method" AS ENUM('POST', 'GET');--> statement-breakpoint

-- Tempory columns to avoid data loss
ALTER TABLE "base_webhooks" ADD COLUMN "type_temp" TEXT;
ALTER TABLE "base_webhooks" ADD COLUMN "event_temp" TEXT;
ALTER TABLE "base_webhooks" ADD COLUMN "method_temp" TEXT;

UPDATE "base_webhooks" SET "type_temp" = "type", "event_temp" = "event", "method_temp" = "method";

-- Drop original columns and create new ones
ALTER TABLE "base_webhooks" DROP COLUMN "type";
ALTER TABLE "base_webhooks" DROP COLUMN "event";
ALTER TABLE "base_webhooks" DROP COLUMN "method";

ALTER TABLE "base_webhooks" ADD COLUMN "type" webhook_type NOT NULL;
ALTER TABLE "base_webhooks" ADD COLUMN "event" webhook_event NOT NULL;
ALTER TABLE "base_webhooks" ADD COLUMN "method" webhook_method NOT NULL DEFAULT 'POST';

-- Copy data back
UPDATE "base_webhooks" SET 
    "type" = CAST("type_temp" AS webhook_type),
    "event" = CAST("event_temp" AS webhook_event),
    "method" = CAST("method_temp" AS webhook_method);--> statement-breakpoint

-- Drop temporary columns
ALTER TABLE "base_webhooks" DROP COLUMN "type_temp";--> statement-breakpoint
ALTER TABLE "base_webhooks" DROP COLUMN "event_temp";--> statement-breakpoint
ALTER TABLE "base_webhooks" DROP COLUMN "method_temp";--> statement-breakpoint