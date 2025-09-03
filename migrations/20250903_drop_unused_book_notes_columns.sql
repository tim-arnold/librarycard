-- Drop unused personal notes feature columns from books table
-- These columns were added in 20250816_add_book_notes_feature.sql but never implemented in the UI/API
-- Removing to clean up schema and fix staging sync column mismatch issues

-- Drop the index first
DROP INDEX IF EXISTS idx_books_personal_notes;

-- Drop the unused columns
ALTER TABLE books DROP COLUMN personal_notes;
ALTER TABLE books DROP COLUMN notes_visibility;
ALTER TABLE books DROP COLUMN last_notes_updated;