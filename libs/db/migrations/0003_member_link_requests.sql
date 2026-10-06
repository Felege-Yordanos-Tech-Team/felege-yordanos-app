CREATE TABLE "member_link_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"member_id" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "member_link_requests_status_check" CHECK ("member_link_requests"."status" = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))
);
--> statement-breakpoint
ALTER TABLE "member_link_requests" ADD CONSTRAINT "member_link_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_link_requests" ADD CONSTRAINT "member_link_requests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_link_requests" ADD CONSTRAINT "member_link_requests_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "public"."auth_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "member_link_requests_one_pending_per_user" ON "member_link_requests" USING btree ("user_id") WHERE "member_link_requests"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_member_link_requests_status" ON "member_link_requests" USING btree ("status");--> statement-breakpoint
-- Reference data: member types from the Sunday School register.
-- The member import maps the register's "Member Type" names to these ids.
INSERT INTO "member_types" ("id", "name") VALUES
  (1, 'Regular'),
  (2, 'Regular_Youth'),
  (3, 'Special_Regular'),
  (4, 'Honorary')
ON CONFLICT DO NOTHING;
