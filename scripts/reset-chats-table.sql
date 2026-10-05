-- Clean reset of chats table with correct schema
-- This script drops and recreates the chats table with the proper conversation_id column

-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS public.chats CASCADE;

-- Create the chats table with correct schema
CREATE TABLE public.chats (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Untitled Chat',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "chats_select_own" ON public.chats;
DROP POLICY IF EXISTS "chats_insert_own" ON public.chats;
DROP POLICY IF EXISTS "chats_update_own" ON public.chats;
DROP POLICY IF EXISTS "chats_delete_own" ON public.chats;

CREATE POLICY "chats_select_own" ON public.chats
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "chats_insert_own" ON public.chats
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chats_update_own" ON public.chats
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chats_delete_own" ON public.chats
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_chats_user_id;
DROP INDEX IF EXISTS idx_chats_updated_at;

CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chats_updated_at ON public.chats(updated_at DESC);

-- Grant necessary permissions
GRANT ALL ON public.chats TO authenticated;
GRANT ALL ON public.chats TO service_role;

-- Reset complete! The chats table now has the correct conversation_id column.