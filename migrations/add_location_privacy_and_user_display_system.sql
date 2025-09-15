-- Location Privacy & User Display Settings - Database Migration
-- LCWEB-174: Location Privacy & User Display Settings
-- Created: December 2024
-- Purpose: Add comprehensive privacy controls for user activity visibility

-- ==================================================
-- PRIVACY OVERRIDE SYSTEM
-- ==================================================

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

-- ==================================================
-- COLUMN ADDITIONS
-- ==================================================

-- Add activity visibility column to locations table
ALTER TABLE locations ADD COLUMN activity_visibility TEXT DEFAULT 'private' CHECK (activity_visibility IN ('private', 'public'));

-- Add display preference columns to users table
ALTER TABLE users ADD COLUMN display_name_preference TEXT DEFAULT 'first_name' CHECK (display_name_preference IN ('first_name', 'full_name', 'email', 'custom_username', 'anonymous'));
ALTER TABLE users ADD COLUMN custom_username VARCHAR(50);

-- Add anonymity flags to activity tables
ALTER TABLE books ADD COLUMN added_by_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE book_ratings ADD COLUMN reviewer_anonymous BOOLEAN DEFAULT FALSE;

-- ==================================================
-- PERFORMANCE INDEXES
-- ==================================================

-- Indexes for location privacy
CREATE INDEX IF NOT EXISTS idx_locations_activity_visibility ON locations(activity_visibility);

-- Indexes for user display preferences
CREATE INDEX IF NOT EXISTS idx_users_display_preference ON users(display_name_preference);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_custom_username_unique ON users(custom_username) WHERE custom_username IS NOT NULL;

-- Indexes for the privacy override table
CREATE INDEX IF NOT EXISTS idx_user_activity_privacy_user_id ON user_activity_privacy(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_privacy_activity ON user_activity_privacy(activity_type, activity_id);

-- Indexes for privacy flags on existing tables
CREATE INDEX IF NOT EXISTS idx_books_added_by_anonymous ON books(added_by_anonymous);
CREATE INDEX IF NOT EXISTS idx_book_ratings_reviewer_anonymous ON book_ratings(reviewer_anonymous);

-- Migration complete - all required columns and indexes have been created