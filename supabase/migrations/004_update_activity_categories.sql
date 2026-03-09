-- ============================================================
-- 004_update_activity_categories.sql
-- Update categories constraint and rename screen-free to drawings.
-- ============================================================

-- 1. Remove old constraint
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS activities_category_check;

-- 2. Migrate existing data
UPDATE public.activities 
SET category = 'drawings' 
WHERE category = 'screen-free';

-- 3. Add new expanded constraint
ALTER TABLE public.activities 
ADD CONSTRAINT activities_category_check 
CHECK (category IN ('logic', 'tracing', 'educational', 'drawings', 'math', 'coloring', 'story'));
