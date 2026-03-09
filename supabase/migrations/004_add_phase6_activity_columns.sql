-- ============================================================
-- 004_add_phase6_activity_columns.sql
-- Adds parent-convenience and format columns to activities.
-- ============================================================

ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'printable'
        CHECK (format IN ('printable', 'parent-led', 'screen-free-play')),
    ADD COLUMN IF NOT EXISTS time_available TEXT NOT NULL DEFAULT '20min'
        CHECK (time_available IN ('5min', '20min', '1hr+')),
    ADD COLUMN IF NOT EXISTS energy_level TEXT NOT NULL DEFAULT 'moderate'
        CHECK (energy_level IN ('exhausted', 'moderate', 'high')),
    ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'indoor'
        CHECK (environment IN ('indoor', 'kitchen', 'on-the-go'));
