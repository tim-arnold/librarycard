-- Migration: Add Book Cover Selection Feature
-- Description: Adds support for storing alternative cover images and selection metadata
-- Date: July 13, 2025

-- Add new columns to books table for cover selection
ALTER TABLE books ADD COLUMN alternative_covers TEXT; -- JSON array of cover options
ALTER TABLE books ADD COLUMN selected_cover_source TEXT; -- JSON metadata about selected cover
ALTER TABLE books ADD COLUMN cover_selection_date TEXT; -- timestamp when cover was selected

-- Note: These fields will be NULL for existing books, maintaining backward compatibility
-- alternative_covers format: 
-- [
--   {
--     "source": "google_books",
--     "google_id": "FmPKzh4f9y8C",
--     "isbn": "9780553801507",
--     "publisher": "Bantam",
--     "publishedDate": "2012",
--     "thumbnail": "https://books.google.com/books/content?id=...",
--     "small": "https://books.google.com/books/content?id=...",
--     "medium": "https://books.google.com/books/content?id=..."
--   }
-- ]

-- selected_cover_source format:
-- {
--   "source": "google_books",
--   "google_id": "FmPKzh4f9y8C",
--   "selection_reason": "user_selected"
-- }