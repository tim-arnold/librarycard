-- Add rollback support to migration tracking system
-- Adds rollback_target column to track which batch is being rolled back
-- Creates optional rollback tracking table for detailed rollback history

-- Add rollback_target column to migration_batches
-- Note: This might fail if column already exists from bootstrap, which is OK
ALTER TABLE migration_batches ADD COLUMN rollback_target TEXT;

-- Create rollback tracking table (optional, for detailed rollback history)
CREATE TABLE IF NOT EXISTS migration_rollbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    rolled_back_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rollback_batch_id TEXT NOT NULL,
    original_batch_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rollback tracking
CREATE INDEX IF NOT EXISTS idx_migration_rollbacks_filename ON migration_rollbacks(filename);
CREATE INDEX IF NOT EXISTS idx_migration_rollbacks_batch ON migration_rollbacks(rollback_batch_id);
CREATE INDEX IF NOT EXISTS idx_migration_rollbacks_date ON migration_rollbacks(rolled_back_at);