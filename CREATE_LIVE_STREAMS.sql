-- CREATE_LIVE_STREAMS.sql
-- Run this script in the Supabase SQL Editor to create the live_streams table and RLS policies

CREATE TABLE IF NOT EXISTS public.live_streams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    youtube_url TEXT,
    instructor_name TEXT,
    is_live BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to live streams for all authenticated users" ON public.live_streams;
DROP POLICY IF EXISTS "Allow admin and staff to manage live streams" ON public.live_streams;

-- RLS Policies
-- 1. All authenticated users (including family profiles) can read the live stream status
CREATE POLICY "Allow read access to live streams for all authenticated users"
ON public.live_streams FOR SELECT
TO authenticated
USING (true);

-- 2. Only administrators / staff can insert, update, or delete stream status
CREATE POLICY "Allow admin and staff to manage live streams"
ON public.live_streams FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (role = 'admin' OR role = 'staff')
    )
);

INSERT INTO public.live_streams (id, title, description, youtube_url, instructor_name, is_live)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'بث الاطمئنان اليومي - الفترة المسائية',
    'بث مباشر يومي مخصص لأهالي المقيمين للاطمئنان على أبنائهم ومتابعة أنشطتهم اليومية بالمركز.',
    '',
    'الأخصائي المناوب بدار شمس',
    false
)
ON CONFLICT (id) DO NOTHING;
