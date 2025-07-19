-- Add single_shelf_location setting to locations table
-- This feature allows locations to be configured as "single shelf" locations
-- where users cannot create multiple shelves or move books between shelves

ALTER TABLE locations ADD COLUMN single_shelf_location BOOLEAN DEFAULT FALSE;

-- Add index for performance when querying this setting
CREATE INDEX IF NOT EXISTS idx_locations_single_shelf ON locations(single_shelf_location);