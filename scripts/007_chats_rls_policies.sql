-- Enable RLS on chats table
alter table public.chats enable row level security;

-- Allow authenticated users to select their own chats
create policy "chats_select_own" on public.chats
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Allow authenticated users to insert their own chats
create policy "chats_insert_own" on public.chats
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow authenticated users to update their own chats
create policy "chats_update_own" on public.chats
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow authenticated users to delete their own chats
create policy "chats_delete_own" on public.chats
  for delete
  to authenticated
  using (auth.uid() = user_id);