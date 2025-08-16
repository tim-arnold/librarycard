-- Add personal notes feature to books
-- This tests the common scenario of adding new columns to existing tables with data
-- Verifies that the automated migration system correctly handles column additions

-- Add a personal notes column to the books table
ALTER TABLE books ADD COLUMN personal_notes TEXT DEFAULT NULL;

-- Add a notes visibility setting (private by default)
ALTER TABLE books ADD COLUMN notes_visibility TEXT DEFAULT 'private' CHECK (notes_visibility IN ('private', 'public', 'shared'));

-- Create an index for efficient notes searching
CREATE INDEX IF NOT EXISTS idx_books_personal_notes ON books(personal_notes) WHERE personal_notes IS NOT NULL;

-- Add a last_notes_updated timestamp
ALTER TABLE books ADD COLUMN last_notes_updated DATETIME DEFAULT NULL;