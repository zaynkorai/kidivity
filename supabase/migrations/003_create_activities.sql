-- ============================================================
-- 003_create_activities.sql
-- AI-generated activities with content and metadata.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('logic', 'tracing', 'educational', 'screen-free')),
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    style TEXT NOT NULL DEFAULT 'colorful' CHECK (style IN ('bw', 'colorful')),
    content TEXT NOT NULL,
    image_url TEXT,
    is_saved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own activities"
    ON public.activities FOR ALL
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id
    ON public.activities(user_id);

CREATE INDEX IF NOT EXISTS idx_activities_kid_profile_id
    ON public.activities(kid_profile_id);

CREATE INDEX IF NOT EXISTS idx_activities_is_saved
    ON public.activities(is_saved) WHERE is_saved = true;
