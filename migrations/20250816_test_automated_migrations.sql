-- Test migration for automated migration system
-- Adds a test column to the users table to verify the automated deployment pipeline
-- This tests the common scenario of adding new columns to existing tables

-- Add a test column to users table
ALTER TABLE users ADD COLUMN migration_test_column TEXT DEFAULT 'automated_migration_success';

-- Create an index on the new column
CREATE INDEX IF NOT EXISTS idx_users_migration_test ON users(migration_test_column);

-- Add a comment field that can be used for testing future features
ALTER TABLE users ADD COLUMN test_notes TEXT DEFAULT NULL;