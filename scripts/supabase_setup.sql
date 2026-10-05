-- ============================================
-- StartupMentor Database Setup (Run all at once)
-- ============================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('entrepreneur', 'investor')),
  company TEXT,
  industry TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  linkedin TEXT,
  twitter TEXT,
  phone TEXT,
  company_stage TEXT CHECK (company_stage IN ('idea', 'prototype', 'mvp', 'early_revenue', 'growth', 'scale')),
  funding_stage TEXT CHECK (funding_stage IN ('pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'bootstrapped')),
  funding_amount_seeking BIGINT,
  pitch_deck_url TEXT,
  investment_focus TEXT[],
  investment_range_min BIGINT,
  investment_range_max BIGINT,
  portfolio_companies TEXT[],
  investment_stage_preference TEXT[],
  profile_completed BOOLEAN DEFAULT FALSE,
  -- Startup analyzer fields
  amount_raised TEXT DEFAULT '',
  amount_seeking TEXT DEFAULT '',
  team_size TEXT DEFAULT '1',
  relationships TEXT DEFAULT '',
  has_vc BOOLEAN DEFAULT false,
  has_angel BOOLEAN DEFAULT false,
  funding_rounds TEXT DEFAULT '',
  milestones TEXT DEFAULT '',
  months_since_founding TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Profiles RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Allow all authenticated users to view profiles
CREATE POLICY "profiles_select_all_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- 5. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type, company, industry)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'entrepreneur'),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'industry', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Create chats table
CREATE TABLE IF NOT EXISTS chats (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Untitled Chat',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable RLS on chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 9. Chats RLS policies
CREATE POLICY "chats_select_own" ON public.chats
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "chats_insert_own" ON public.chats
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chats_update_own" ON public.chats
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chats_delete_own" ON public.chats
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 10. Performance indexes
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);

-- ✅ Setup complete!
