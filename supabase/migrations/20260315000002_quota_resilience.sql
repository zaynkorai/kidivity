-- Add status to activities
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_status') THEN
        CREATE TYPE activity_status AS ENUM ('generating', 'completed', 'failed');
    END IF;
END $$;

ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS status activity_status DEFAULT 'completed';

-- Update existing activities to completed
UPDATE public.activities SET status = 'completed' WHERE status IS NULL;

-- Add comment
COMMENT ON COLUMN public.activities.status IS 'Current state of the activity generation flow.';
