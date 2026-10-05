-- ============================================
-- Migration: Add Startup Analyzer fields to profiles
-- Run this in Supabase SQL Editor if you already have the profiles table
-- ============================================

-- Add new columns for the Startup Analyzer auto-fill
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS amount_raised TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS amount_seeking TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS team_size TEXT DEFAULT '1',
ADD COLUMN IF NOT EXISTS relationships TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS has_vc BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_angel BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS funding_rounds TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS milestones TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS months_since_founding TEXT DEFAULT '';

-- Update funding_stage CHECK constraint to include 'bootstrapped'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_funding_stage_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_funding_stage_check
  CHECK (funding_stage IN ('pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'bootstrapped'));

-- ✅ Migration complete!
