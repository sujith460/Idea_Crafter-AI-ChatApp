-- Migration script for chats table
-- This script handles the column name mismatch between id and conversation_id

-- Check if chats table exists and what columns it has
DO $$
BEGIN
    -- If the table exists with 'id' column, rename it to 'conversation_id'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chats' AND column_name = 'id' AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chats' AND column_name = 'conversation_id' AND table_schema = 'public'
    ) THEN
        -- Rename id column to conversation_id
        ALTER TABLE public.chats RENAME COLUMN id TO conversation_id;

        -- Update the primary key constraint name if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = 'chats' AND constraint_type = 'PRIMARY KEY' AND table_schema = 'public'
        ) THEN
            -- Drop existing primary key and recreate with new name
            ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_pkey;
            ALTER TABLE public.chats ADD PRIMARY KEY (conversation_id);
        END IF;

        RAISE NOTICE 'Migrated chats table: renamed id column to conversation_id';
    END IF;

    -- If the table doesn't exist at all, create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'chats' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.chats (
            conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            title TEXT DEFAULT 'Untitled Chat',
            messages JSONB NOT NULL DEFAULT '[]'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        RAISE NOTICE 'Created new chats table with conversation_id';
    END IF;

    -- Ensure RLS is enabled
    ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist (to avoid conflicts)
    DROP POLICY IF EXISTS "chats_select_own" ON public.chats;
    DROP POLICY IF EXISTS "chats_insert_own" ON public.chats;
    DROP POLICY IF EXISTS "chats_update_own" ON public.chats;
    DROP POLICY IF EXISTS "chats_delete_own" ON public.chats;

    -- Create RLS policies
    CREATE POLICY "chats_select_own" ON public.chats
        FOR SELECT TO authenticated USING (auth.uid() = user_id);

    CREATE POLICY "chats_insert_own" ON public.chats
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "chats_update_own" ON public.chats
        FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "chats_delete_own" ON public.chats
        FOR DELETE TO authenticated USING (auth.uid() = user_id);

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
    CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);

    RAISE NOTICE 'Chats table migration completed successfully';
END $$;