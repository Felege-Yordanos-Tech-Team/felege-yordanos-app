CREATE TABLE "notice_reads" (
	"notice_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notice_reads_pkey" PRIMARY KEY("notice_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"department_id" bigint,
	"image_key" text,
	"pinned" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notices_category_check" CHECK ("notices"."category" = ANY (ARRAY['general'::text, 'urgent'::text, 'event'::text, 'liturgical'::text, 'fundraising'::text, 'community'::text]))
);
--> statement-breakpoint
ALTER TABLE "notice_reads" ADD CONSTRAINT "notice_reads_notice_id_fkey" FOREIGN KEY ("notice_id") REFERENCES "public"."notices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notice_reads" ADD CONSTRAINT "notice_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notice_reads_user_id" ON "notice_reads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notices_created_at" ON "notices" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_notices_department_id" ON "notices" USING btree ("department_id");