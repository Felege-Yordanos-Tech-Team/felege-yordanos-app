-- Events and attendance tables for the attendance module.

CREATE TABLE IF NOT EXISTS public.events (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  event_date    date NOT NULL,
  start_time    time,
  end_time      time,
  department_id bigint REFERENCES public.departments(id),
  created_by    uuid REFERENCES public.profiles(id),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.attendance (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id  bigint NOT NULL REFERENCES public.members(id),
  status     text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_by  uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, member_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Index for fast attendance lookups
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON public.attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON public.attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_events_department_id ON public.events(department_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date DESC);
