-- Add series approval workflow
-- Allows admin approval of new series before they become visible to all users
-- Part of LCWEB-13 series system implementation

-- Add approval status and related fields to series table
ALTER TABLE series ADD COLUMN approval_status TEXT DEFAULT 'pending';
ALTER TABLE series ADD COLUMN approved_by TEXT;
ALTER TABLE series ADD COLUMN approved_at DATETIME;
ALTER TABLE series ADD COLUMN rejection_reason TEXT;

-- Add foreign key constraint for approved_by (references admin user)
-- Note: Cannot add FOREIGN KEY constraint via ALTER TABLE in SQLite
-- The application layer will ensure this references a valid user ID

-- Add index for approval status queries
CREATE INDEX IF NOT EXISTS idx_series_approval_status ON series(approval_status);

-- Update existing series to be approved (for backward compatibility)
-- This ensures existing series remain visible
UPDATE series SET approval_status = 'approved', approved_at = CURRENT_TIMESTAMP WHERE approval_status = 'pending';