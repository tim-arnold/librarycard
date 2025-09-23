-- LCWEB-190: AI Book Cover Verification Appeals System
-- Create tables for handling appeals when AI incorrectly rejects legitimate book covers

-- Table to store book cover appeal submissions
CREATE TABLE IF NOT EXISTS book_cover_appeals (
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

  -- Foreign key relationships
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_book_cover_appeals_user_id ON book_cover_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_book_cover_appeals_status ON book_cover_appeals(status);
CREATE INDEX IF NOT EXISTS idx_book_cover_appeals_submitted_at ON book_cover_appeals(submitted_at);

-- Table to store AI classification allowlist updates from appeals
CREATE TABLE IF NOT EXISTS ai_classification_allowlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL UNIQUE, -- AI classification label to allow
  confidence_threshold REAL DEFAULT 0.2, -- Minimum confidence to accept this label
  added_by TEXT NOT NULL, -- Admin who added this label
  added_from_appeal_id INTEGER, -- Reference to the appeal that triggered this addition
  reason TEXT, -- Why this label was added to allowlist
  is_active BOOLEAN DEFAULT TRUE,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (added_from_appeal_id) REFERENCES book_cover_appeals(id) ON DELETE SET NULL
);

-- Index for efficient allowlist lookups
CREATE INDEX IF NOT EXISTS idx_ai_allowlist_label ON ai_classification_allowlist(label);
CREATE INDEX IF NOT EXISTS idx_ai_allowlist_active ON ai_classification_allowlist(is_active);

-- Table to track appeal resolution actions for audit trail
CREATE TABLE IF NOT EXISTS appeal_resolution_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appeal_id INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('approved_image', 'added_to_allowlist', 'rejected_appeal', 'admin_note')),
  action_details TEXT, -- JSON with specific details of the action
  performed_by TEXT NOT NULL,
  performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (appeal_id) REFERENCES book_cover_appeals(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for audit trail queries
CREATE INDEX IF NOT EXISTS idx_appeal_actions_appeal_id ON appeal_resolution_actions(appeal_id);
CREATE INDEX IF NOT EXISTS idx_appeal_actions_performed_at ON appeal_resolution_actions(performed_at);

-- Update the updated_at timestamp when appeals are modified
CREATE TRIGGER IF NOT EXISTS update_book_cover_appeals_updated_at
  AFTER UPDATE ON book_cover_appeals
  FOR EACH ROW
BEGIN
  UPDATE book_cover_appeals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update the updated_at timestamp when allowlist is modified
CREATE TRIGGER IF NOT EXISTS update_ai_allowlist_updated_at
  AFTER UPDATE ON ai_classification_allowlist
  FOR EACH ROW
BEGIN
  UPDATE ai_classification_allowlist SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;