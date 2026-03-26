-- Row Level Security policies for the profiles table.
-- Assumes RLS is already enabled (done in 001_create_profile_trigger.sql).

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
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

-- ============================================================
-- UPDATE policies
-- ============================================================

-- Users can update their own profile, but NOT the role column.
-- They can change display_name, full_name, etc.
create policy "Users can update own profile (except role)"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Prevent role escalation: role must stay the same
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- Super admins can update any profile, including role
create policy "Super admins can update any profile"
  on public.profiles
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'super_admin'
    )
  );
