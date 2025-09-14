-- Per-Action Privacy Overrides - Database Migration
-- LCWEB-174: Location Privacy & User Display Settings
-- Created: December 2024
-- Purpose: Add per-action privacy controls and retroactive privacy management

-- Create new table for per-action privacy overrides
-- This allows users to set specific activities as anonymous even if their default preference is public
CREATE TABLE IF NOT EXISTS user_activity_privacy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('book_addition', 'review', 'checkout')),
  activity_id TEXT NOT NULL, -- References the specific book_id, rating_id, checkout_id, etc.
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, activity_type, activity_id)
);

-- Add privacy flags to existing activity tables for direct storage (performance optimization)

-- Add anonymous flag to books table for book additions
ALTER TABLE books ADD COLUMN added_by_anonymous BOOLEAN DEFAULT FALSE;

-- Add anonymous flag to book_ratings table for reviews
ALTER TABLE book_ratings ADD COLUMN reviewer_anonymous BOOLEAN DEFAULT FALSE;

-- Note: Checkout privacy would need to be added to checkout-related tables when that feature is implemented
-- This might be in a checkouts table or similar, depending on current checkout implementation

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_privacy_user_id ON user_activity_privacy(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_privacy_activity ON user_activity_privacy(activity_type, activity_id);
CREATE INDEX IF NOT EXISTS idx_books_added_by_anonymous ON books(added_by_anonymous);
CREATE INDEX IF NOT EXISTS idx_book_ratings_reviewer_anonymous ON book_ratings(reviewer_anonymous);