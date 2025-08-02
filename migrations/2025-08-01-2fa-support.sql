-- LibraryCard 2FA Database Migration
-- Date: August 1, 2025
-- Purpose: Add Two-Factor Authentication support

-- Add 2FA columns to users table
ALTER TABLE users ADD COLUMN totp_secret TEXT;
ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN totp_enabled_at DATETIME;
ALTER TABLE users ADD COLUMN backup_codes TEXT; -- JSON array of hashed backup codes

-- Create recovery codes table for better management
CREATE TABLE IF NOT EXISTS user_recovery_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recovery_codes_user ON user_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_used ON user_recovery_codes(used_at);

-- Users with 2FA enabled index
CREATE INDEX IF NOT EXISTS idx_users_2fa_enabled ON users(totp_enabled);