-- ============================================================
-- 002_create_kid_profiles.sql
-- Kid profiles — each parent can have multiple children.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kid_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 1 AND age <= 18),
    grade_level TEXT NOT NULL,
    interests TEXT[] NOT NULL DEFAULT '{}',
    avatar_color TEXT DEFAULT '#6C63FF',
    activity_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Users can only access their own kids' profiles
ALTER TABLE public.kid_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own kid profiles"
    ON public.kid_profiles FOR ALL
    USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_kid_profiles_user_id
    ON public.kid_profiles(user_id);

-- Auto-update `updated_at`
CREATE TRIGGER set_kid_profiles_updated_at
    BEFORE UPDATE ON public.kid_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
