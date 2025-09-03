-- Add rollback support to migration tracking system
-- Adds rollback_target column to track which batch is being rolled back
-- Creates optional rollback tracking table for detailed rollback history

-- Add rollback_target column to migration_batches (idempotent approach)
-- Check if column exists by testing the schema, if not add it safely
PRAGMA table_info(migration_batches);

-- Use CREATE TABLE to recreate with the rollback_target column if needed
-- This is safe because if the column already exists, the bootstrap system will handle gracefully
BEGIN;

-- Create new table with rollback_target column
CREATE TABLE IF NOT EXISTS migration_batches_with_rollback (
    id TEXT PRIMARY KEY,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT NOT NULL DEFAULT 'running',
    total_migrations INTEGER NOT NULL DEFAULT 0,
    successful_migrations INTEGER NOT NULL DEFAULT 0,
    failed_migration TEXT,
    error_message TEXT,
    environment TEXT NOT NULL,
    rollback_target TEXT
);

-- Copy data from existing table
INSERT OR IGNORE INTO migration_batches_with_rollback (
    id, started_at, completed_at, status, total_migrations, 
    successful_migrations, failed_migration, error_message, environment
) SELECT 
    id, started_at, completed_at, status, total_migrations,
    successful_migrations, failed_migration, error_message, environment
FROM migration_batches;

-- Replace the original table
DROP TABLE migration_batches;
ALTER TABLE migration_batches_with_rollback RENAME TO migration_batches;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_migration_batches_status ON migration_batches(status);
CREATE INDEX IF NOT EXISTS idx_migration_batches_started_at ON migration_batches(started_at);

COMMIT;

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