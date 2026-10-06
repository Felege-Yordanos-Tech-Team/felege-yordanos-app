CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"member_id" bigint NOT NULL,
	"status" text NOT NULL,
	"marked_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "attendance_event_id_member_id_key" UNIQUE("event_id","member_id"),
	CONSTRAINT "attendance_status_check" CHECK ("attendance"."status" = ANY (ARRAY['present'::text, 'absent'::text, 'late'::text]))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"emoji" text DEFAULT '🎵',
	"color" text DEFAULT '#0E7490',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "categories_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_am" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donor_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"currency" text DEFAULT 'ETB',
	"payment_method" text,
	"receipt_url" text,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"rejection_reason" text,
	CONSTRAINT "donations_payment_method_check" CHECK ("donations"."payment_method" = ANY (ARRAY['bank_transfer'::text, 'telebirr'::text, 'cash'::text, 'other'::text])),
	CONSTRAINT "donations_status_check" CHECK ("donations"."status" = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text]))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_date" date NOT NULL,
	"department_id" bigint,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"start_time" time,
	"end_time" time,
	"recurrence_group" uuid,
	"recurrence" text,
	"recurrence_until" date,
	CONSTRAINT "events_recurrence_check" CHECK (("events"."recurrence" IS NULL) OR ("events"."recurrence" = ANY (ARRAY['weekly'::text, 'biweekly'::text, 'monthly'::text])))
);
--> statement-breakpoint
CREATE TABLE "member_academic_education" (
	"id" bigint PRIMARY KEY NOT NULL,
	"member_id" bigint NOT NULL,
	"level" text,
	"field_of_study" text,
	"institution" text,
	"start_date" date,
	"end_date" date,
	"till_present" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "member_jobs" (
	"id" bigint PRIMARY KEY NOT NULL,
	"member_id" bigint NOT NULL,
	"job_type" text,
	"company" text,
	"start_date" date,
	"end_date" date,
	"till_present" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "member_spiritual_education" (
	"id" bigint PRIMARY KEY NOT NULL,
	"member_id" bigint NOT NULL,
	"title" text,
	"college" text,
	"start_date" date,
	"end_date" date,
	"award_by" text,
	"custom_award_giver" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "member_types" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "member_types_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" bigint PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"member_type_id" bigint,
	"department_id" bigint,
	"member_state" text,
	"status" text DEFAULT 'Active',
	"registration_date" date,
	"document_number" text,
	"title" text,
	"name" text NOT NULL,
	"father_name" text NOT NULL,
	"grandfather_name" text,
	"mother_full_name" text,
	"god_name" text,
	"baptised_church" text,
	"birth_date" date,
	"gender" text,
	"marital_status" text,
	"address_state" text,
	"address_city" text,
	"address_sub_city" text,
	"address_woreda" text,
	"address_sefer" text,
	"address_phone" text,
	"address_phone_two" text,
	"address_email" text,
	"address_house_number" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"auth_user_id" uuid,
	CONSTRAINT "members_member_id_key" UNIQUE("member_id"),
	CONSTRAINT "members_auth_user_id_key" UNIQUE("auth_user_id"),
	CONSTRAINT "members_gender_check" CHECK ("members"."gender" = ANY (ARRAY['ወንድ'::text, 'ሴት'::text]))
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"department_id" bigint,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profiles_role_check" CHECK ("profiles"."role" = ANY (ARRAY['member'::text, 'dept_head'::text, 'admin'::text, 'super_admin'::text]))
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer,
	"title" text NOT NULL,
	"title_en" text,
	"category" text NOT NULL,
	"lyrics" text NOT NULL,
	"audio_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "songs_number_key" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_academic_education" ADD CONSTRAINT "member_academic_education_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_jobs" ADD CONSTRAINT "member_jobs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_spiritual_education" ADD CONSTRAINT "member_spiritual_education_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_member_type_id_fkey" FOREIGN KEY ("member_type_id") REFERENCES "public"."member_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attendance_event_id" ON "attendance" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_member_id" ON "attendance" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_donations_donor_id" ON "donations" USING btree ("donor_id");--> statement-breakpoint
CREATE INDEX "idx_donations_status" ON "donations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_events_department_id" ON "events" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_events_date" ON "events" USING btree ("event_date" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "idx_events_recurrence_group" ON "events" USING btree ("recurrence_group") WHERE "events"."recurrence_group" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_members_auth_user_id" ON "members" USING btree ("auth_user_id");