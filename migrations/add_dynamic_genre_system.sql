-- Dynamic Genre Management System Migration
-- Creates new tables for curated genres, book-genre relationships, and genre suggestions
-- This enables dynamic, user-manageable genre classification

-- Global curated genres table
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

-- Many-to-many relationship between books and curated genres
CREATE TABLE IF NOT EXISTS book_genres (
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

-- Genre suggestions from users for admin approval
CREATE TABLE IF NOT EXISTS genre_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  suggested_name TEXT NOT NULL,
  description TEXT,
  suggested_by TEXT NOT NULL,
  book_id INTEGER, -- Optional: book that prompted the suggestion
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by TEXT,
  reviewed_at DATETIME,
  review_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (suggested_by) REFERENCES users(id),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Indexes for performance
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