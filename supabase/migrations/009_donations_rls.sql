-- RLS policies for donations table.

-- SELECT: users can read their own donations
CREATE POLICY "Users can read own donations"
  ON public.donations
  FOR SELECT
  USING (donor_id = auth.uid());

-- SELECT: admin, super_admin, and Budget & Asset Management dept head (dept 9)
CREATE POLICY "Authorized users can read all donations"
  ON public.donations
  FOR SELECT
  USING (
    public.get_my_role() IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'dept_head'
        AND department_id = 9
    )
  );

-- INSERT: any authenticated user (for their own donor_id)
CREATE POLICY "Users can create own donations"
  ON public.donations
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND donor_id = auth.uid()
  );

-- UPDATE: only admin, super_admin, or Budget dept head (dept 9)
-- Used for verifying/rejecting donations
CREATE POLICY "Authorized users can update donations"
  ON public.donations
  FOR UPDATE
  USING (
    public.get_my_role() IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'dept_head'
        AND department_id = 9
    )
  );
