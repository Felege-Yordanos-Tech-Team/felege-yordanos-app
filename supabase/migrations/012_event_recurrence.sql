-- 012_event_recurrence.sql
-- Recurring events via materialized occurrences.
--
-- A recurring series is stored as one events row per occurrence, all sharing a
-- recurrence_group uuid. Cadence never changes after creation and the horizon
-- is capped at 12 months (enforced in the app layer). One-off events leave all
-- three columns NULL, so this change is fully backward-compatible.

alter table public.events
  add column if not exists recurrence_group uuid,
  add column if not exists recurrence       text,
  add column if not exists recurrence_until date;

-- Supported cadences only (NULL allowed for one-off events).
alter table public.events
  drop constraint if exists events_recurrence_check;
alter table public.events
  add constraint events_recurrence_check
  check (recurrence is null or recurrence in ('weekly', 'biweekly', 'monthly'));

-- Partial index: only series rows are indexed (most events are one-offs),
-- keeping it small while making group lookups (extend/shorten/delete) fast.
create index if not exists idx_events_recurrence_group
  on public.events (recurrence_group)
  where recurrence_group is not null;

comment on column public.events.recurrence_group is
  'Shared UUID linking all occurrences of one recurring series; NULL for one-off events.';
comment on column public.events.recurrence is
  'Cadence of the series: weekly | biweekly | monthly; NULL for one-off events.';
comment on column public.events.recurrence_until is
  'Current end date of the series (<= 12 months from series start, enforced in app).';
