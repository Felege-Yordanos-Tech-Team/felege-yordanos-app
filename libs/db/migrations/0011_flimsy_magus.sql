CREATE TABLE "department_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"department_id" bigint NOT NULL,
	"role" text NOT NULL,
	"from" timestamp with time zone NOT NULL,
	"to" timestamp with time zone,
	"assigned_by" uuid,
	CONSTRAINT "department_memberships_role_check" CHECK ("department_memberships"."role" = ANY (ARRAY['member'::text, 'dept_head'::text]))
);
--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "code" text;--> statement-breakpoint
UPDATE "departments" SET "code" = CASE "name_en"
  WHEN 'Planning, Implementation & Monitoring' THEN 'planning_monitoring'
  WHEN 'Education & Training' THEN 'education_training'
  WHEN 'Programs & Events' THEN 'programs_events'
  WHEN 'Human Resources / People Operations' THEN 'people_operations'
  WHEN 'Information & Internal Communications' THEN 'internal_communications'
  WHEN 'Songs & Celebrations' THEN 'songs_celebrations'
  WHEN 'Arts & Culture' THEN 'arts_culture'
  WHEN 'Development & Charity' THEN 'development_charity'
  WHEN 'Budget & Asset Management' THEN 'budget_assets'
END;--> statement-breakpoint
ALTER TABLE "departments" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "department_memberships" ADD CONSTRAINT "department_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_memberships" ADD CONSTRAINT "department_memberships_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_memberships" ADD CONSTRAINT "department_memberships_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."auth_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_department_memberships_user" ON "department_memberships" USING btree ("user_id","from");--> statement-breakpoint
CREATE INDEX "idx_department_memberships_department" ON "department_memberships" USING btree ("department_id","from");--> statement-breakpoint
INSERT INTO "department_memberships" ("user_id", "department_id", "role", "from")
SELECT "id", "department_id", 'dept_head', COALESCE("updated_at", "created_at", now())
FROM "profiles"
WHERE "role" = 'dept_head' AND "department_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "department_memberships_one_active_user" ON "department_memberships" USING btree ("user_id") WHERE "to" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "department_memberships_one_active_head" ON "department_memberships" USING btree ("department_id") WHERE "role" = 'dept_head' AND "to" IS NULL;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_code_key" UNIQUE("code");--> statement-breakpoint
CREATE FUNCTION "department_memberships_append_only"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'department_memberships history is append-only';
  END IF;
  IF OLD.user_id IS DISTINCT FROM NEW.user_id
     OR OLD.department_id IS DISTINCT FROM NEW.department_id
     OR OLD.role IS DISTINCT FROM NEW.role
     OR OLD."from" IS DISTINCT FROM NEW."from"
     OR OLD.assigned_by IS DISTINCT FROM NEW.assigned_by
     OR OLD."to" IS NOT NULL THEN
    RAISE EXCEPTION 'department_memberships history is append-only';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "department_memberships_no_change"
BEFORE UPDATE OR DELETE ON "department_memberships"
FOR EACH ROW EXECUTE FUNCTION "department_memberships_append_only"();
