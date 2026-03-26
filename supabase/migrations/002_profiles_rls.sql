-- Row Level Security policies for the profiles table.
-- Assumes RLS is already enabled (done in 001_create_profile_trigger.sql).

-- Helper function to get a user's role without triggering RLS.
-- SECURITY DEFINER bypasses RLS, preventing infinite recursion.
create or replace function public.get_my_role()
returns text
language sql
stable
security definer set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ============================================================
-- SELECT policies
-- ============================================================

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Admins and super_admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles
  for select
  using (public.get_my_role() in ('admin', 'super_admin'));

-- ============================================================
-- UPDATE policies
-- ============================================================

-- Users can update their own profile (role protection is
-- handled at the application layer — the form only sends
-- display_name, never role).
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Super admins can update any profile, including role
create policy "Super admins can update any profile"
  on public.profiles
  for update
  using (public.get_my_role() = 'super_admin');
