-- Add rating and feedback_text to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating IN (-1, 0, 1)) DEFAULT 0,
ADD COLUMN IF NOT EXISTS feedback_text TEXT;

-- Index ratings for faster retrieval during prompt generation
CREATE INDEX IF NOT EXISTS idx_activities_rating ON public.activities(kid_profile_id, rating) WHERE rating != 0;
