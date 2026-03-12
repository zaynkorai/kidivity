-- ============================================================
-- 005_update_categories_v2.sql
-- Update categories constraint to match latest frontend types
-- ============================================================

-- 1. Remove old constraint
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS activities_category_check;

-- 2. Migrate existing data to the new categories so the constraint doesn't fail
UPDATE public.activities SET category = 'puzzles' WHERE category = 'logic';
UPDATE public.activities SET category = 'art' WHERE category = 'drawings';
UPDATE public.activities SET category = 'art' WHERE category = 'coloring';
UPDATE public.activities SET category = 'reading' WHERE category = 'story';
UPDATE public.activities SET category = 'reading' WHERE category = 'educational';

-- 3. Add new expanded constraint matching Kaivity constants
ALTER TABLE public.activities 
ADD CONSTRAINT activities_category_check 
CHECK (category IN ('puzzles', 'tracing', 'science', 'art', 'math', 'reading'));
