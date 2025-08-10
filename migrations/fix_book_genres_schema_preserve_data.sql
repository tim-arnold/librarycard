-- Fix existing book_genres table schema while preserving existing data
-- This handles the case where book_genres table exists but lacks new columns

-- First, create backup of existing book_genres data if table exists
CREATE TABLE IF NOT EXISTS book_genres_backup AS 
SELECT * FROM book_genres WHERE 1=0; -- Create empty table with same structure

-- Try to backup existing data (will fail silently if book_genres doesn't exist)
INSERT OR IGNORE INTO book_genres_backup 
SELECT book_id, genre_id, 
       'system' as assigned_by,  -- Default value for missing column
       CURRENT_TIMESTAMP as assigned_at,  -- Default timestamp
       0 as is_auto_assigned  -- Default to manual assignment
FROM book_genres;

-- Create curated_genres table if it doesn't exist
CREATE TABLE IF NOT EXISTS curated_genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Now safely drop and recreate book_genres with proper schema
DROP TABLE IF EXISTS book_genres;

CREATE TABLE book_genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  genre_id INTEGER NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_auto_assigned BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES curated_genres(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  UNIQUE(book_id, genre_id)
);

-- Restore backed up data with proper schema
INSERT OR IGNORE INTO book_genres (book_id, genre_id, assigned_by, assigned_at, is_auto_assigned)
SELECT book_id, genre_id, assigned_by, assigned_at, is_auto_assigned
FROM book_genres_backup;

-- Clean up backup table
DROP TABLE IF EXISTS book_genres_backup;

-- Create genre_suggestions table if it doesn't exist
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (suggested_by) REFERENCES users(id),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Create all indexes
CREATE INDEX IF NOT EXISTS idx_curated_genres_name ON curated_genres(name);
CREATE INDEX IF NOT EXISTS idx_curated_genres_active ON curated_genres(is_active);
CREATE INDEX IF NOT EXISTS idx_curated_genres_created_by ON curated_genres(created_by);

CREATE INDEX IF NOT EXISTS idx_book_genres_book ON book_genres(book_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_genre ON book_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_assigned_by ON book_genres(assigned_by);
CREATE INDEX IF NOT EXISTS idx_book_genres_auto_assigned ON book_genres(is_auto_assigned);

CREATE INDEX IF NOT EXISTS idx_genre_suggestions_status ON genre_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_genre_suggestions_suggested_by ON genre_suggestions(suggested_by);
CREATE INDEX IF NOT EXISTS idx_genre_suggestions_book ON genre_suggestions(book_id);
CREATE INDEX IF NOT EXISTS idx_genre_suggestions_reviewed_by ON genre_suggestions(reviewed_by);