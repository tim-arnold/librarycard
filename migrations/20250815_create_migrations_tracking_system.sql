-- Migration tracking system for automated database migrations
-- This table tracks which migrations have been applied to prevent duplicates
-- and enable rollback functionality

CREATE TABLE IF NOT EXISTS migrations_applied (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checksum TEXT NOT NULL,
    execution_time_ms INTEGER,
    rollback_sql TEXT,
    batch_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_migrations_applied_filename ON migrations_applied(filename);
CREATE INDEX IF NOT EXISTS idx_migrations_applied_batch ON migrations_applied(batch_id);
CREATE INDEX IF NOT EXISTS idx_migrations_applied_date ON migrations_applied(applied_at);

-- Migration batches table to track deployment batches
CREATE TABLE IF NOT EXISTS migration_batches (
    id TEXT PRIMARY KEY,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'rolled_back')),
    total_migrations INTEGER NOT NULL DEFAULT 0,
    successful_migrations INTEGER NOT NULL DEFAULT 0,
    failed_migration TEXT,
    error_message TEXT,
    environment TEXT NOT NULL DEFAULT 'unknown',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for batch tracking
CREATE INDEX IF NOT EXISTS idx_migration_batches_status ON migration_batches(status);
CREATE INDEX IF NOT EXISTS idx_migration_batches_date ON migration_batches(started_at);