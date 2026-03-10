-- Remove interests from kid_profiles (no longer used in app or prompts)
ALTER TABLE public.kid_profiles
    DROP COLUMN IF EXISTS interests;
