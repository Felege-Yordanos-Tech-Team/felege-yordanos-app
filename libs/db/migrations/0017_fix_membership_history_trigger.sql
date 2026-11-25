CREATE OR REPLACE FUNCTION "department_memberships_append_only"() RETURNS trigger
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
$$;
