-- Add generation_limit to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS generation_limit INTEGER DEFAULT 1;

-- Add comment
COMMENT ON COLUMN public.users.generation_limit IS 'Maximum number of free activities a user can generate per day.';
