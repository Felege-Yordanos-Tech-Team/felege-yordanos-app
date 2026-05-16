-- Fix profiles UPDATE policy so users cannot escalate their own role
-- or change their own department_id by calling the Supabase API directly.
--
-- The previous policy ("Users can update own profile") only checked that
-- auth.uid() = id, with no constraint on which columns were being modified.
-- The comment in 002_profiles_rls.sql claimed "role protection is handled
-- at the application layer" — but that only protects against the in-app
-- form, not someone hitting PostgREST directly with a custom role payload.

-- 1. Drop the unsafe policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Replacement policy: users can update their own profile, but role
--    and department_id must match the current values.
--    Super admins are still allowed to change roles via the separate
--    "Super admins can update any profile" policy (unchanged).
CREATE POLICY "Users can update own profile safely"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND department_id IS NOT DISTINCT FROM (
      SELECT department_id FROM public.profiles WHERE id = auth.uid()
    )
  );
