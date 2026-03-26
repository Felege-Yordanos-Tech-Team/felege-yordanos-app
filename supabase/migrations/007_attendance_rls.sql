-- RLS policies for events and attendance tables.

-- ============================================================
-- EVENTS
-- ============================================================

-- SELECT: authenticated users can see events from their dept,
-- OR all events if admin/super_admin or Programs & Events dept (id=3)
CREATE POLICY "Users can read events"
  ON public.events
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      -- admin/super_admin see all
      public.get_my_role() IN ('admin', 'super_admin')
      -- Programs & Events dept (id=3) sees all
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND department_id = 3
      )
      -- dept_head sees own dept events
      OR (
        public.get_my_role() = 'dept_head'
        AND department_id = (
          SELECT department_id FROM public.profiles WHERE id = auth.uid()
        )
      )
      -- regular members see events from their dept
      OR department_id = (
        SELECT department_id FROM public.profiles WHERE id = auth.uid()
      )
      -- events with no department are visible to all
      OR department_id IS NULL
    )
  );

-- INSERT: dept_head (own dept), admin, super_admin
CREATE POLICY "Authorized users can create events"
  ON public.events
  FOR INSERT
  WITH CHECK (
    public.get_my_role() IN ('admin', 'super_admin')
    OR (
      public.get_my_role() = 'dept_head'
      AND department_id = (
        SELECT department_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- UPDATE: creator, admin, super_admin
CREATE POLICY "Authorized users can update events"
  ON public.events
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR public.get_my_role() IN ('admin', 'super_admin')
  );

-- DELETE: creator, admin, super_admin
CREATE POLICY "Authorized users can delete events"
  ON public.events
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR public.get_my_role() IN ('admin', 'super_admin')
  );

-- ============================================================
-- ATTENDANCE
-- ============================================================

-- SELECT: own attendance (via members.auth_user_id), or all if
-- dept_head (own dept), admin, super_admin, Programs & Events
CREATE POLICY "Users can read attendance"
  ON public.attendance
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      -- own attendance
      EXISTS (
        SELECT 1 FROM public.members
        WHERE members.id = attendance.member_id
          AND members.auth_user_id = auth.uid()
      )
      -- admin/super_admin see all
      OR public.get_my_role() IN ('admin', 'super_admin')
      -- Programs & Events dept sees all
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND department_id = 3
      )
      -- dept_head sees attendance for own dept events
      OR (
        public.get_my_role() = 'dept_head'
        AND EXISTS (
          SELECT 1 FROM public.events
          WHERE events.id = attendance.event_id
            AND events.department_id = (
              SELECT department_id FROM public.profiles WHERE id = auth.uid()
            )
        )
      )
    )
  );

-- INSERT: dept_head (own dept events), admin, super_admin
CREATE POLICY "Authorized users can mark attendance"
  ON public.attendance
  FOR INSERT
  WITH CHECK (
    public.get_my_role() IN ('admin', 'super_admin')
    OR (
      public.get_my_role() = 'dept_head'
      AND EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = attendance.event_id
          AND events.department_id = (
            SELECT department_id FROM public.profiles WHERE id = auth.uid()
          )
      )
    )
  );

-- UPDATE: dept_head (own dept events), admin, super_admin
CREATE POLICY "Authorized users can update attendance"
  ON public.attendance
  FOR UPDATE
  USING (
    public.get_my_role() IN ('admin', 'super_admin')
    OR (
      public.get_my_role() = 'dept_head'
      AND EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = attendance.event_id
          AND events.department_id = (
            SELECT department_id FROM public.profiles WHERE id = auth.uid()
          )
      )
    )
  );
