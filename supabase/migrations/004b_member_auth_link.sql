-- Add auth_user_id column to members table so authenticated users
-- can link their account to their existing Sunday School member record.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id);

-- Fast lookup by auth_user_id
CREATE INDEX IF NOT EXISTS idx_members_auth_user_id
  ON public.members(auth_user_id);

-- ============================================================
-- RLS policies for members table
-- ============================================================

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users can read their own linked record
CREATE POLICY "Users can read own linked member"
  ON public.members
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- SELECT: authenticated users can read unclaimed records (for claim flow)
CREATE POLICY "Users can read unclaimed members"
  ON public.members
  FOR SELECT
  USING (auth_user_id IS NULL AND auth.role() = 'authenticated');

-- SELECT: admin/super_admin can read all members
CREATE POLICY "Admins can read all members"
  ON public.members
  FOR SELECT
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- UPDATE: authenticated user can claim an unclaimed record
-- (set auth_user_id = their uid WHERE auth_user_id IS NULL)
CREATE POLICY "Users can claim unclaimed member"
  ON public.members
  FOR UPDATE
  USING (auth_user_id IS NULL)
  WITH CHECK (auth_user_id = auth.uid());

-- UPDATE: admin/super_admin can update any member record
CREATE POLICY "Admins can update any member"
  ON public.members
  FOR UPDATE
  USING (public.get_my_role() IN ('admin', 'super_admin'));
