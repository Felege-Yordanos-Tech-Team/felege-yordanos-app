ALTER TABLE "message_broadcasts" ADD COLUMN "sms_parts" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
-- Broadcasts from before #150: one numbered message = one SMS part.
UPDATE "message_broadcasts" SET "sms_parts" = jsonb_array_length("parts");--> statement-breakpoint
ALTER TABLE "message_broadcasts" ADD CONSTRAINT "message_broadcasts_sms_parts_check" CHECK ("message_broadcasts"."sms_parts" BETWEEN 1 AND 10);
