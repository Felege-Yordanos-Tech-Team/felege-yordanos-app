-- RLS policies for categories and songs tables.
-- Assumes RLS is already enabled (done in 003_seed_songs.sql).

-- ============================================================
-- CATEGORIES — read-only for authenticated users
-- ============================================================

create policy "Authenticated users can read categories"
  on public.categories
  for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- SONGS — read for authenticated, write for admin/super_admin
-- ============================================================

-- SELECT: any authenticated user can read songs
create policy "Authenticated users can read songs"
  on public.songs
  for select
  using (auth.role() = 'authenticated');

-- INSERT: only admin and super_admin
create policy "Admins can insert songs"
  on public.songs
  for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

-- UPDATE: only admin and super_admin
create policy "Admins can update songs"
  on public.songs
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

-- DELETE: only admin and super_admin
create policy "Admins can delete songs"
  on public.songs
  for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );
