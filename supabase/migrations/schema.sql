-- ============================================================
-- 20260313000000_consolidated_schema.sql
-- Consolidated schema for Kaivity (Kidivity)
-- ============================================================

-- 1. Helper Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Tables

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{
        "default_style": "colorful",
        "default_difficulty": "medium"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Kid Profiles
CREATE TABLE IF NOT EXISTS public.kid_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 1 AND age <= 18),
    grade_level TEXT NOT NULL,
    avatar_color TEXT DEFAULT '#6C63FF',
    activity_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activities
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('puzzles', 'tracing', 'science', 'art', 'math', 'reading')),
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    style TEXT NOT NULL DEFAULT 'colorful' CHECK (style IN ('bw', 'colorful')),
    content TEXT NOT NULL,
    image_url TEXT,
    is_saved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Journey Items (Scheduling)
CREATE TABLE IF NOT EXISTS public.journey_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity Completions
CREATE TABLE IF NOT EXISTS public.activity_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    journey_item_id UUID REFERENCES public.journey_items(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT now(),
    completed_date DATE NOT NULL,
    CONSTRAINT activity_completions_source_chk CHECK (
        activity_id IS NOT NULL OR journey_item_id IS NOT NULL
    )
);

-- Onboarding Sessions
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    step INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uniq_user_onboarding UNIQUE (user_id)
);

-- 3. Row Level Security (RLS)

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Kid Profiles policies
CREATE POLICY "Users can CRUD own kid profiles" ON public.kid_profiles FOR ALL USING (auth.uid() = user_id);

-- Activities policies (Enforced ownership)
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.activities FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.kid_profiles kp WHERE kp.id = kid_profile_id AND kp.user_id = auth.uid())
);
CREATE POLICY "Users can update own activities" ON public.activities FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (
    auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.kid_profiles kp WHERE kp.id = kid_profile_id AND kp.user_id = auth.uid())
);
CREATE POLICY "Users can delete own activities" ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- Journey Items policies
CREATE POLICY "Users can CRUD own journey items" ON public.journey_items FOR ALL USING (auth.uid() = user_id);

-- Activity Completions policies
CREATE POLICY "Users can CRUD own activity completions" ON public.activity_completions FOR ALL USING (auth.uid() = user_id);

-- Onboarding Sessions policies
CREATE POLICY "Users can CRUD own onboarding sessions" ON public.onboarding_sessions FOR ALL USING (auth.uid() = user_id);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_kid_profiles_user_id ON public.kid_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_kid_profile_id ON public.activities(kid_profile_id);
CREATE INDEX IF NOT EXISTS idx_activities_is_saved ON public.activities(is_saved) WHERE is_saved = true;
CREATE INDEX IF NOT EXISTS idx_journey_items_user_id ON public.journey_items(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_items_kid_date ON public.journey_items(kid_profile_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_activity_completions_user_id ON public.activity_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_completions_kid_date ON public.activity_completions(kid_profile_id, completed_date);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_activity_completions_journey_item ON public.activity_completions(journey_item_id) WHERE journey_item_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_activity_completions_activity_day ON public.activity_completions(kid_profile_id, activity_id, completed_date) WHERE activity_id IS NOT NULL;

-- 5. Triggers
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_kid_profiles_updated_at BEFORE UPDATE ON public.kid_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_onboarding_sessions_updated_at BEFORE UPDATE ON public.onboarding_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Complex Functions

-- get_kid_activity_stats
CREATE OR REPLACE FUNCTION get_kid_activity_stats(
    p_kid_profile_id UUID,
    p_timezone_name TEXT
) RETURNS json AS $$
DECLARE
    v_total INT;
    v_week_count INT;
    v_streak INT := 0;
    v_last_created_at TIMESTAMPTZ;
    v_expected_date DATE;
    v_current_date DATE;
    rec RECORD;
BEGIN
    -- 1. Get total count
    SELECT COUNT(*) INTO v_total FROM activities WHERE kid_profile_id = p_kid_profile_id;

    -- 2. Get week count (last 7 days based on current time)
    SELECT COUNT(*) INTO v_week_count FROM activities WHERE kid_profile_id = p_kid_profile_id AND created_at >= NOW() - INTERVAL '7 days';

    -- 3. Get last_created_at
    SELECT created_at INTO v_last_created_at FROM activities WHERE kid_profile_id = p_kid_profile_id ORDER BY created_at DESC LIMIT 1;

    -- 4. Calculate streak
    FOR rec IN 
        SELECT DISTINCT DATE(created_at AT TIME ZONE p_timezone_name) AS activity_date
        FROM activities
        WHERE kid_profile_id = p_kid_profile_id
        ORDER BY activity_date DESC
    LOOP
        IF v_expected_date IS NULL THEN
            v_current_date := DATE(NOW() AT TIME ZONE p_timezone_name);
            IF rec.activity_date = v_current_date OR rec.activity_date = (v_current_date - INTERVAL '1 day') THEN
                v_streak := 1;
                v_expected_date := rec.activity_date - INTERVAL '1 day';
            ELSE
                EXIT;
            END IF;
        ELSE
            IF rec.activity_date = v_expected_date THEN
                v_streak := v_streak + 1;
                v_expected_date := v_expected_date - INTERVAL '1 day';
            ELSE
                EXIT;
            END IF;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'total', COALESCE(v_total, 0),
        'weekCount', COALESCE(v_week_count, 0),
        'streak', v_streak,
        'lastCreatedAt', v_last_created_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
