-- Database Setup Script for Chatbot Application
-- Run this script in your Supabase SQL Editor to set up the database

-- 1. Create profiles table (if not exists)
create table if not exists profiles (
  id uuid references auth.users on delete cascade,
  email text,
  user_type text check (user_type in ('entrepreneur', 'investor')),
  full_name text,
  company text,
  industry text,
  created_at timestamp with time zone default now(),
  primary key (id)
);

-- 2. Create chats table
create table if not exists chats (
  conversation_id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text default 'Untitled Chat',
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default now()
);

-- 3. Enable RLS on chats table
alter table public.chats enable row level security;

-- 4. Create RLS policies for chats table
create policy "chats_select_own" on public.chats
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "chats_insert_own" on public.chats
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "chats_update_own" on public.chats
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chats_delete_own" on public.chats
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 5. Create indexes for better performance
create index if not exists idx_chats_user_id on public.chats(user_id);
create index if not exists idx_chats_updated_at on public.chats(updated_at desc);

-- Setup complete! You can now use the chatbot application.