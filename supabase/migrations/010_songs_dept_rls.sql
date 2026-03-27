-- Migration: Allow Songs & Celebrations department (id=6) dept_heads
-- to manage songs and categories alongside admin/super_admin.

-- ============================================================
-- SONGS — drop existing write policies and recreate with dept_head support
-- ============================================================

DROP POLICY IF EXISTS "Admins can insert songs" ON public.songs;
DROP POLICY IF EXISTS "Admins can update songs" ON public.songs;
DROP POLICY IF EXISTS "Admins can delete songs" ON public.songs;

-- INSERT
CREATE POLICY "Authorized users can insert songs" ON public.songs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (
          profiles.role IN ('admin', 'super_admin')
          OR (profiles.role = 'dept_head' AND profiles.department_id = '6')
        )
    )
  );

-- UPDATE
CREATE POLICY "Authorized users can update songs" ON public.songs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (
          profiles.role IN ('admin', 'super_admin')
          OR (profiles.role = 'dept_head' AND profiles.department_id = '6')
        )
    )
  );

-- DELETE
CREATE POLICY "Authorized users can delete songs" ON public.songs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (
          profiles.role IN ('admin', 'super_admin')
          OR (profiles.role = 'dept_head' AND profiles.department_id = '6')
        )
    )
  );

-- ============================================================
-- CATEGORIES — add write policies (currently only SELECT exists)
-- ============================================================

-- INSERT
CREATE POLICY "Authorized users can insert categories" ON public.categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (
          profiles.role IN ('admin', 'super_admin')
          OR (profiles.role = 'dept_head' AND profiles.department_id = '6')
        )
    )
  );

-- UPDATE
CREATE POLICY "Authorized users can update categories" ON public.categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (
          profiles.role IN ('admin', 'super_admin')
          OR (profiles.role = 'dept_head' AND profiles.department_id = '6')
        )
    )
  );

-- DELETE
CREATE POLICY "Authorized users can delete categories" ON public.categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (
          profiles.role IN ('admin', 'super_admin')
          OR (profiles.role = 'dept_head' AND profiles.department_id = '6')
        )
    )
  );
