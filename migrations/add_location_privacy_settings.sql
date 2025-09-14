-- Location Privacy Settings - Database Migration
-- LCWEB-174: Location Privacy & User Display Settings
-- Created: December 2024
-- Purpose: Add privacy control settings to locations for user activity visibility

-- Add activity visibility setting to locations table
ALTER TABLE locations ADD COLUMN activity_visibility TEXT DEFAULT 'private' CHECK (activity_visibility IN ('private', 'public'));

-- Create index for performance on privacy queries
CREATE INDEX IF NOT EXISTS idx_locations_activity_visibility ON locations(activity_visibility);

-- Add updated_at trigger for locations table (if not already exists)
-- This ensures the updated_at field is properly maintained when privacy settings change