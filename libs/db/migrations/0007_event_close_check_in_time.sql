ALTER TABLE "attendance" ADD COLUMN "checked_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "method" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "closed_by" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_method_check" CHECK (("attendance"."method" IS NULL) OR ("attendance"."method" = ANY (ARRAY['qr'::text, 'quick_id'::text, 'list'::text, 'auto_close'::text])));