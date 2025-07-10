-- Migration: Update Enhanced Genres
-- This SQL script re-classifies enhanced_genres for books that have problematic data
-- 
-- SAFETY: 
-- - Creates a backup of current data
-- - Only updates books with obviously wrong enhanced_genres (contains commas, long strings, etc.)
-- - Preserves original categories and subjects
--
-- Step 1: Create backup table
CREATE TABLE IF NOT EXISTS enhanced_genres_backup AS
SELECT id, title, enhanced_genres, categories, subjects, datetime('now') as backup_date
FROM books 
WHERE enhanced_genres IS NOT NULL;

-- Step 2: Clear enhanced_genres for books that have obviously wrong data
-- (Raw categories typically contain commas, long strings, or obvious raw data patterns)
UPDATE books 
SET enhanced_genres = NULL 
WHERE enhanced_genres IS NOT NULL 
AND (
  -- Contains commas (typical of raw categories)
  enhanced_genres LIKE '%,%' 
  OR
  -- Contains obvious raw patterns
  enhanced_genres LIKE '%Fiction / %'
  OR  
  enhanced_genres LIKE '%----%'
  OR
  enhanced_genres LIKE '% and %'
  OR
  enhanced_genres LIKE '%criticism%'
  OR
  enhanced_genres LIKE '%History and criticism%'
  OR
  -- Very long genre names (likely raw subjects)
  length(enhanced_genres) > 200
  OR
  -- Contains brackets (typical of raw data)
  enhanced_genres LIKE '%[%'
  OR
  enhanced_genres LIKE '%]%'
);

-- Step 3: Show what was affected
SELECT 
  'Enhanced genres cleared for re-classification' as action,
  COUNT(*) as affected_books
FROM books 
WHERE id IN (
  SELECT id FROM enhanced_genres_backup 
  WHERE enhanced_genres IS NOT NULL
) 
AND enhanced_genres IS NULL;

-- Step 4: Show backup info
SELECT 
  'Backup created' as action,
  COUNT(*) as total_books_backed_up,
  MIN(backup_date) as backup_timestamp
FROM enhanced_genres_backup;