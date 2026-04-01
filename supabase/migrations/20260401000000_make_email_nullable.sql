-- Make email nullable in public.users to support anonymous login
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- Update RLS policies to ensure anonymous users can still access their own data
-- (They already use auth.uid() which works for anonymous users too)
COMMENT ON COLUMN public.users.email IS 'Email of the user (null for anonymous users).';
