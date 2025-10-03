-- Migration: Add export permissions to locations
-- Date: 2025-01-30
-- Description: Add allow_user_exports column to locations table to control whether non-admin users can export library data

-- Add allow_user_exports column to locations table
ALTER TABLE locations ADD COLUMN allow_user_exports INTEGER DEFAULT 1;

-- Update existing locations to allow exports by default
UPDATE locations SET allow_user_exports = 1 WHERE allow_user_exports IS NULL;
