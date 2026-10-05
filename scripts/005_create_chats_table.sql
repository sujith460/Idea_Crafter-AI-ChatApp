create table if not exists chats (
  conversation_id uuid primary key default gen_random_uuid(), -- Unique ID for the conversation
  user_id uuid references profiles(id) on delete cascade,   -- User reference
  title text default 'Untitled Chat',                        -- Conversation title (generated from summary)
  messages jsonb not null default '[]'::jsonb,              -- JSON array of messages
  updated_at timestamp with time zone default now()         -- Last updated timestamp
);
