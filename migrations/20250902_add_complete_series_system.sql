-- Complete series system for organizing books with approval workflow
-- Combines series creation and approval workflow in single migration to avoid deployment issues
-- Implements database schema from LCWEB-13

-- Series table with approval workflow fields
CREATE TABLE IF NOT EXISTS series (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT, -- Optional hex color for visual distinction
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sort_order INTEGER DEFAULT 0,
    approval_status TEXT DEFAULT 'pending', -- pending/approved/rejected
    approved_by TEXT, -- Admin user ID who approved/rejected
    approved_at DATETIME, -- Timestamp of approval/rejection
    rejection_reason TEXT, -- Optional reason for rejection
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Many-to-many relationship between books and series
CREATE TABLE IF NOT EXISTS book_series (
    book_id TEXT NOT NULL,
    series_id TEXT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (book_id, series_id),
    FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
    FOREIGN KEY (series_id) REFERENCES series (id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_series_user_id ON series(user_id);
CREATE INDEX IF NOT EXISTS idx_series_sort_order ON series(sort_order);
CREATE INDEX IF NOT EXISTS idx_series_created_at ON series(created_at);
CREATE INDEX IF NOT EXISTS idx_series_approval_status ON series(approval_status);
CREATE INDEX IF NOT EXISTS idx_book_series_book_id ON book_series(book_id);
CREATE INDEX IF NOT EXISTS idx_book_series_series_id ON book_series(series_id);
CREATE INDEX IF NOT EXISTS idx_book_series_added_at ON book_series(added_at);

-- Update any existing series to be approved (for backward compatibility)
-- This ensures any existing series remain visible after migration
UPDATE series SET approval_status = 'approved', approved_at = CURRENT_TIMESTAMP WHERE approval_status = 'pending';