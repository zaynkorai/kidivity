-- ============================================================
-- 010_create_onboarding_sessions.sql
-- Onboarding session persistence for multi-device sync
-- ============================================================

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

-- RLS
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Only users can see/edit their own sessions
CREATE POLICY "Users can CRUD own onboarding sessions"
    ON public.onboarding_sessions FOR ALL
    USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_onboarding_sessions_updated_at
    BEFORE UPDATE ON public.onboarding_sessions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
