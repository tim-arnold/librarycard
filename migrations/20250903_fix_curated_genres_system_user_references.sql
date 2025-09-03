-- Fix curated_genres references to non-existent 'system' user
-- Update to use real admin user instead of phantom 'system' user
-- This prevents foreign key constraint failures during staging sync

-- Update all curated_genres created by 'system' to use the main admin user
UPDATE curated_genres 
SET created_by = 'tim.arnold@gmail.com'
WHERE created_by = 'system';

-- Verify the update
-- This should return 0 rows after the update
-- SELECT COUNT(*) FROM curated_genres WHERE created_by = 'system';