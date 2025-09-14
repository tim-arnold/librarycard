-- User Display Preferences - Database Migration
-- LCWEB-174: Location Privacy & User Display Settings
-- Created: December 2024
-- Purpose: Add user display name preferences for customizable identity display

-- Add display name preference to users table
ALTER TABLE users ADD COLUMN display_name_preference TEXT DEFAULT 'first_name' CHECK (display_name_preference IN ('first_name', 'full_name', 'email', 'custom_username', 'anonymous'));

-- Add custom username field for users who choose custom display names
ALTER TABLE users ADD COLUMN custom_username VARCHAR(50);

-- Create index for performance on display preference queries
CREATE INDEX IF NOT EXISTS idx_users_display_preference ON users(display_name_preference);

-- Create unique index on custom_username to prevent duplicates (allowing NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_custom_username_unique ON users(custom_username) WHERE custom_username IS NOT NULL;

-- Update the updated_at field when these new columns are modified
-- This will be handled by application logic when updating user preferences