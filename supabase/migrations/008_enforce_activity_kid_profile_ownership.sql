-- ============================================================
-- 008_enforce_activity_kid_profile_ownership.sql
-- Enforce kid_profile ownership on activities.
-- ============================================================

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own activities" ON public.activities;

CREATE POLICY "Users can view own activities"
    ON public.activities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
    ON public.activities FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM public.kid_profiles kp
            WHERE kp.id = kid_profile_id
              AND kp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own activities"
    ON public.activities FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM public.kid_profiles kp
            WHERE kp.id = kid_profile_id
              AND kp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own activities"
    ON public.activities FOR DELETE
    USING (auth.uid() = user_id);
