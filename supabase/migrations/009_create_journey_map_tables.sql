-- ============================================================
-- 009_create_journey_map_tables.sql
-- Journey Map scheduling + completion tracking
-- ============================================================

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

-- RLS
ALTER TABLE public.journey_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own journey items"
    ON public.journey_items FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own activity completions"
    ON public.activity_completions FOR ALL
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journey_items_user_id
    ON public.journey_items(user_id);

CREATE INDEX IF NOT EXISTS idx_journey_items_kid_date
    ON public.journey_items(kid_profile_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_activity_completions_user_id
    ON public.activity_completions(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_completions_kid_date
    ON public.activity_completions(kid_profile_id, completed_date);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_activity_completions_journey_item
    ON public.activity_completions(journey_item_id)
    WHERE journey_item_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_activity_completions_activity_day
    ON public.activity_completions(kid_profile_id, activity_id, completed_date)
    WHERE activity_id IS NOT NULL;
