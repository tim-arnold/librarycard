-- Fix book_cover_appeals table schema to ensure proper auto-incrementing IDs
-- This addresses an issue where the table was created without PRIMARY KEY AUTOINCREMENT

-- Check if the table exists and has the incorrect schema
-- We'll recreate it with the correct schema and preserve existing data

BEGIN TRANSACTION;

-- Create backup of existing data
CREATE TABLE book_cover_appeals_backup AS SELECT * FROM book_cover_appeals;

-- Drop the potentially incorrect table
DROP TABLE book_cover_appeals;

-- Create the table with proper schema (matches the original migration intent)
CREATE TABLE book_cover_appeals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  appeal_reason TEXT, -- User's explanation of why they believe it's legitimate
  image_data_url TEXT NOT NULL, -- Base64 data URL of the rejected image
  image_metadata TEXT, -- JSON metadata (size, format, dimensions)
  ai_classification_results TEXT, -- JSON of AI results (detected labels and confidence scores)
  rejection_reason TEXT NOT NULL, -- Original AI rejection reason

  -- Appeal status and resolution
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
  admin_notes TEXT, -- Admin comments on the decision
  resolved_by TEXT, -- Admin user ID who resolved the appeal
  resolved_at DATETIME,

  -- Timestamps
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Restore data (IDs will be auto-generated for records that had NULL IDs)
INSERT INTO book_cover_appeals (user_id, book_title, book_author, appeal_reason, image_data_url, image_metadata, ai_classification_results, rejection_reason, status, admin_notes, resolved_by, resolved_at, submitted_at, updated_at)
SELECT user_id, book_title, book_author, appeal_reason, image_data_url, image_metadata, ai_classification_results, rejection_reason, status, admin_notes, resolved_by, resolved_at, submitted_at, updated_at
FROM book_cover_appeals_backup;

-- Drop the backup table
DROP TABLE book_cover_appeals_backup;

-- Recreate indexes from original migration
CREATE INDEX IF NOT EXISTS idx_book_cover_appeals_user_id ON book_cover_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_book_cover_appeals_status ON book_cover_appeals(status);
CREATE INDEX IF NOT EXISTS idx_book_cover_appeals_submitted_at ON book_cover_appeals(submitted_at);

-- Recreate the update trigger from original migration
CREATE TRIGGER IF NOT EXISTS update_book_cover_appeals_updated_at
  AFTER UPDATE ON book_cover_appeals
  FOR EACH ROW
BEGIN
  UPDATE book_cover_appeals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

COMMIT;