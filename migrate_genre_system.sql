-- Migration for Dynamic Genre Management System
-- Execute this against production database after worker deployment
-- 
-- IMPORTANT: This migration was successfully executed on 2025-07-09
-- The tables and data already exist in production. This file is preserved
-- for future reference or disaster recovery scenarios.

-- Global curated genres table (without foreign key constraints for D1 compatibility)
CREATE TABLE IF NOT EXISTS curated_genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Many-to-many relationship between books and curated genres
CREATE TABLE IF NOT EXISTS book_genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  genre_id INTEGER NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_auto_assigned BOOLEAN DEFAULT FALSE,
  UNIQUE(book_id, genre_id)
);

-- Genre suggestions from users for admin approval
CREATE TABLE IF NOT EXISTS genre_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  suggested_name TEXT NOT NULL,
  description TEXT,
  suggested_by TEXT NOT NULL,
  book_id INTEGER,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at DATETIME,
  review_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add assigned_genres column to books table
ALTER TABLE books ADD COLUMN assigned_genres TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_curated_genres_name ON curated_genres(name);
CREATE INDEX IF NOT EXISTS idx_curated_genres_active ON curated_genres(is_active);
CREATE INDEX IF NOT EXISTS idx_book_genres_book ON book_genres(book_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_genre ON book_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_genre_suggestions_status ON genre_suggestions(status);

-- Insert initial curated genres (45 genres from spec)
-- Split into smaller batches for D1 compatibility
INSERT INTO curated_genres (name, description, created_by) VALUES
-- Fiction Genres Batch 1 (10)
('Action & Adventure', 'Fast-paced stories with exciting plots', 'system'),
('Children''s Literature', 'Books written specifically for children', 'system'),
('Classics', 'Timeless literary works of enduring value', 'system'),
('Comedy & Humor', 'Light-hearted and amusing stories', 'system'),
('Contemporary Fiction', 'Modern stories set in present day', 'system'),
('Crime & Mystery', 'Stories involving crime solving and mysteries', 'system'),
('Dystopian & Post-Apocalyptic', 'Stories set in dark future societies', 'system'),
('Fantasy', 'Stories with magical or supernatural elements', 'system'),
('Gothic & Horror', 'Dark, atmospheric stories meant to frighten', 'system'),
('Graphic Novel & Comics', 'Visual storytelling with illustrations', 'system');

INSERT INTO curated_genres (name, description, created_by) VALUES
-- Fiction Genres Batch 2 (10)
('Historical Fiction', 'Stories set in the past', 'system'),
('Literary Fiction', 'Character-driven stories with artistic merit', 'system'),
('Magical Realism', 'Realistic stories with magical elements', 'system'),
('Paranormal & Supernatural', 'Stories involving supernatural phenomena', 'system'),
('Poetry', 'Literary works in verse form', 'system'),
('Psychological Thriller', 'Suspenseful stories focused on psychology', 'system'),
('Romance', 'Stories centered on love relationships', 'system'),
('Science Fiction', 'Stories about future technology and space', 'system'),
('Short Stories', 'Collections of brief fictional works', 'system'),
('Thriller & Suspense', 'Fast-paced stories with tension and danger', 'system');

INSERT INTO curated_genres (name, description, created_by) VALUES
-- Fiction Genres Batch 3 + Non-Fiction Batch 1 (10)
('Urban Fantasy', 'Fantasy stories set in modern urban settings', 'system'),
('War Fiction', 'Stories set during wartime', 'system'),
('Western', 'Stories set in the American Old West', 'system'),
('Young Adult', 'Fiction targeted at teenage readers', 'system'),
('LGBTQ+ Fiction', 'Stories featuring LGBTQ+ characters and themes', 'system'),
('Art & Design', 'Books about visual arts and design', 'system'),
('Biography & Memoir', 'Life stories and personal accounts', 'system'),
('Business & Economics', 'Books about business and economic topics', 'system'),
('Cooking & Food', 'Recipes and food-related content', 'system'),
('Education & Academia', 'Educational and scholarly works', 'system');

INSERT INTO curated_genres (name, description, created_by) VALUES
-- Non-Fiction Genres Batch 2 (10)
('Essays & Literature', 'Collections of essays and literary criticism', 'system'),
('Health & Fitness', 'Books about wellness and physical health', 'system'),
('History', 'Historical accounts and analysis', 'system'),
('Philosophy', 'Philosophical works and ideas', 'system'),
('Politics & Social Issues', 'Books about government and social topics', 'system'),
('Psychology', 'Books about human behavior and mental processes', 'system'),
('Reference & How-To', 'Instructional and reference materials', 'system'),
('Religion & Spirituality', 'Books about faith and spiritual topics', 'system'),
('Science & Nature', 'Scientific and natural world topics', 'system'),
('Self-Help & Personal Development', 'Books for personal improvement', 'system');

INSERT INTO curated_genres (name, description, created_by) VALUES
-- Non-Fiction Genres Batch 3 (5)
('Sports & Recreation', 'Books about sports and recreational activities', 'system'),
('Technology & Computing', 'Books about technology and computers', 'system'),
('Travel & Adventure', 'Travel guides and adventure stories', 'system'),
('True Crime', 'Non-fiction crime stories', 'system'),
('Current Events & Journalism', 'News and contemporary issues', 'system');