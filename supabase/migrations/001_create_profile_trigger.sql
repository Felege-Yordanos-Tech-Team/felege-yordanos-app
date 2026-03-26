-- Auto-create a profile row when a new user signs up via Supabase Auth.
-- The trigger fires AFTER INSERT on auth.users and creates a corresponding
-- row in public.profiles with role = 'member' and display_name = email.

-- 1. Create the profiles table (if it doesn't already exist)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  full_name   text,
  role        text not null default 'member'
              check (role in ('member', 'dept_head', 'admin', 'super_admin')),
  department_id uuid,
  created_at  timestamptz not null default now()
);

-- 2. Enable RLS (policies defined in 002_profiles_rls.sql)
alter table public.profiles enable row level security;

-- 3. Function that runs on every new auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    'member'
  );
  return new;
end;
$$;

-- 4. Wire the trigger
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
