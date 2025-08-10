-- Add genre requests table for tracking genre requests in admin notifications
CREATE TABLE IF NOT EXISTS genre_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  genre_name TEXT NOT NULL,
  description TEXT,
  reason TEXT NOT NULL,
  requested_by TEXT NOT NULL, -- user ID
  requester_name TEXT,
  requester_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT, -- super admin who reviewed it
  reviewed_at DATETIME,
  notes TEXT -- admin notes when approving/rejecting
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_genre_requests_status ON genre_requests(status);
CREATE INDEX IF NOT EXISTS idx_genre_requests_requested_by ON genre_requests(requested_by);