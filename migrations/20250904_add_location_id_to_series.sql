-- Add location_id to series table for location-based access control
-- Addresses LCWEB-153: Associate approved series with locations for proper access control

-- Add location_id column to series table
ALTER TABLE series ADD COLUMN location_id INTEGER;

-- Add foreign key constraint to locations table
-- Note: SQLite doesn't support adding FK constraints to existing tables,
-- so we'll handle referential integrity in application code

-- Create index for performance on location-based queries
CREATE INDEX IF NOT EXISTS idx_series_location_id ON series(location_id);

-- Update existing series to associate with the creator's primary location
-- This ensures backward compatibility for existing series
UPDATE series 
SET location_id = (
  SELECT lm.location_id 
  FROM location_members lm 
  WHERE lm.user_id = series.user_id 
  ORDER BY lm.joined_at ASC 
  LIMIT 1
)
WHERE location_id IS NULL;

-- For any series that still don't have a location_id (users without location membership),
-- associate them with the first available location (fallback)
UPDATE series 
SET location_id = (
  SELECT id 
  FROM locations 
  ORDER BY created_at ASC 
  LIMIT 1
)
WHERE location_id IS NULL;