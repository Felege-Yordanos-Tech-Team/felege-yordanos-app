ALTER TABLE "message_broadcasts" DROP CONSTRAINT "message_broadcasts_status_check";--> statement-breakpoint
ALTER TABLE "event_reminders" ADD COLUMN "send_time" time DEFAULT '09:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "message_broadcasts" ADD COLUMN "scheduled_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_message_broadcasts_scheduled" ON "message_broadcasts" USING btree ("scheduled_at") WHERE "message_broadcasts"."status" = 'scheduled';--> statement-breakpoint
ALTER TABLE "message_broadcasts" ADD CONSTRAINT "message_broadcasts_scheduled_at_check" CHECK ("message_broadcasts"."status" <> 'scheduled' OR "message_broadcasts"."scheduled_at" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "message_broadcasts" ADD CONSTRAINT "message_broadcasts_status_check" CHECK ("message_broadcasts"."status" = ANY (ARRAY['scheduled'::text, 'queued'::text, 'sending'::text, 'paused'::text, 'done'::text, 'cancelled'::text, 'missed'::text]));