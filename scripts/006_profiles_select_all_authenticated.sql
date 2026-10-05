-- Allow authenticated users to select all profiles so platform members are visible in the "Find" section.
-- Safe to add alongside existing "select own" policy.

create policy if not exists "profiles_select_all_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);
